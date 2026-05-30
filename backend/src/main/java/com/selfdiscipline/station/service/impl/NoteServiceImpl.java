package com.selfdiscipline.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.selfdiscipline.station.dto.NoteCreateDTO;
import com.selfdiscipline.station.dto.NoteUpdateDTO;
import com.selfdiscipline.station.entity.Note;
import com.selfdiscipline.station.mapper.NoteMapper;
import com.selfdiscipline.station.service.NoteService;
import com.selfdiscipline.station.service.NoteVersionService;
import com.selfdiscipline.station.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NoteServiceImpl extends ServiceImpl<NoteMapper, Note> implements NoteService {

    @Autowired
    private NoteVersionService noteVersionService;

    private static final Set<String> SORT_WHITELIST = new HashSet<>(Arrays.asList("updateTime", "createTime", "title"));

    @Override
    public List<Note> listNotes(String keyword, Long folderId, String tag, Integer pinned, String sort) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getUserId, UserContext.getUserId());

        if (folderId != null) {
            wrapper.eq(Note::getFolderId, folderId);
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(Note::getTitle, keyword)
                    .or()
                    .like(Note::getContent, keyword)
            );
        }

        if (StringUtils.hasText(tag)) {
            wrapper.apply("FIND_IN_SET({0}, tags)", tag.trim());
        }

        if (pinned != null && pinned == 1) {
            wrapper.eq(Note::getIsPinned, 1);
        }

        // 排序：置顶始终优先，其次按用户指定字段
        wrapper.orderByDesc(Note::getIsPinned);
        String sortField = (sort != null && SORT_WHITELIST.contains(sort)) ? sort : "updateTime";
        switch (sortField) {
            case "createTime":
                wrapper.orderByDesc(Note::getCreateTime);
                break;
            case "title":
                wrapper.orderByAsc(Note::getTitle);
                break;
            default:
                wrapper.orderByDesc(Note::getUpdateTime);
        }

        return list(wrapper);
    }

    @Override
    public List<Map<String, Object>> getTagStats() {
        List<String> allTags = baseMapper.selectAllTags(UserContext.getUserId());
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (String raw : allTags) {
            for (String t : parseTags(raw)) {
                countMap.merge(t, 1L, Long::sum);
            }
        }
        // 按 count 降序
        return countMap.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", e.getKey());
                    m.put("count", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Override
    public int normalizeAllTags() {
        List<Note> tagged = baseMapper.selectTaggedNotes(UserContext.getUserId());
        int updated = 0;
        for (Note note : tagged) {
            String normalized = normalizeTags(note.getTags());
            // 只在归一化结果与原值不同时才更新
            if (normalized != null && !normalized.equals(note.getTags())) {
                baseMapper.updateTagsById(note.getId(), normalized);
                updated++;
            }
        }
        return updated;
    }

    /**
     * 标签字符串拆分为独立标签列表
     */
    private List<String> parseTags(String tags) {
        if (!StringUtils.hasText(tags)) return List.of();
        return Arrays.stream(tags.split("[,，\\s]+"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * 标签归一化：拆分 → 去空 → 去重 → 逗号空格拼接
     */
    private String normalizeTags(String tags) {
        List<String> list = parseTags(tags);
        return list.isEmpty() ? null : String.join(",", list);
    }

    @Override
    public Note getNoteById(Long id) {
        Note note = getById(id);
        if (note == null || !UserContext.getUserId().equals(note.getUserId())) {
            return null;
        }
        return note;
    }

    @Override
    public Note createNote(NoteCreateDTO dto) {
        Note note = new Note();
        note.setUserId(UserContext.getUserId());
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setFolderId(dto.getFolderId());
        note.setTags(normalizeTags(dto.getTags()));
        note.setIsPinned(0);
        note.setIsDeleted(0);

        // 自动生成摘要：取内容前 200 字符
        if (StringUtils.hasText(dto.getContent())) {
            String plainText = dto.getContent().replaceAll("[#*`>\\-\\[\\]()!]", "").trim();
            note.setSummary(plainText.length() > 200 ? plainText.substring(0, 200) : plainText);
        }

        save(note);
        return note;
    }

    @Override
    public Note updateNote(Long id, NoteUpdateDTO dto) {
        Note note = getById(id);
        if (note == null || !UserContext.getUserId().equals(note.getUserId())) {
            return null;
        }

        // 自动版本策略：更新前检查是否需要保存旧内容为版本
        if (dto.getContent() != null) {
            noteVersionService.autoSaveVersion(id, note.getTitle(), note.getContent(),
                    note.getTags(), note.getFolderId(), note.getIsPinned(), dto.getContent());
        }

        if (dto.getTitle() != null) {
            note.setTitle(dto.getTitle());
        }
        if (dto.getContent() != null) {
            note.setContent(dto.getContent());
            // 更新摘要
            String plainText = dto.getContent().replaceAll("[#*`>\\-\\[\\]()!]", "").trim();
            note.setSummary(plainText.length() > 200 ? plainText.substring(0, 200) : plainText);
        }
        if (dto.getFolderId() != null) {
            note.setFolderId(dto.getFolderId());
        }
        if (dto.getTags() != null) {
            note.setTags(normalizeTags(dto.getTags()));
        }
        if (dto.getIsPinned() != null) {
            note.setIsPinned(dto.getIsPinned());
        }

        updateById(note);
        return note;
    }

    @Override
    public void deleteNote(Long id) {
        Note note = getById(id);
        if (note == null || !UserContext.getUserId().equals(note.getUserId())) {
            return;
        }
        // 逻辑删除由 MyBatis-Plus @TableLogic 自动处理
        removeById(id);
    }

    @Override
    public List<Note> listTrashNotes() {
        return baseMapper.selectTrashNotes(UserContext.getUserId());
    }

    @Override
    public boolean restoreNote(Long id) {
        // 先查回收站中是否存在（用自定义 SQL 绕过 @TableLogic）
        List<Note> trash = baseMapper.selectTrashNotes(UserContext.getUserId());
        boolean inTrash = trash.stream().anyMatch(n -> n.getId().equals(id));
        if (!inTrash) {
            return false;
        }
        return baseMapper.restoreById(id) > 0;
    }

    @Override
    public int permanentDeleteNote(Long id) {
        // 只允许彻底删除已进入回收站的笔记
        List<Note> trash = baseMapper.selectTrashNotes(UserContext.getUserId());
        boolean inTrash = trash.stream().anyMatch(n -> n.getId().equals(id));
        if (!inTrash) {
            return 0; // 笔记未在回收站
        }
        // 级联删除版本记录
        noteVersionService.deleteAllVersions(id);
        return baseMapper.permanentDeleteById(id) > 0 ? 1 : -1;
    }
}
