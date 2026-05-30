package com.selfdiscipline.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.selfdiscipline.station.entity.Note;
import com.selfdiscipline.station.entity.NoteVersion;
import com.selfdiscipline.station.mapper.NoteMapper;
import com.selfdiscipline.station.mapper.NoteVersionMapper;
import com.selfdiscipline.station.service.NoteVersionService;
import com.selfdiscipline.station.util.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NoteVersionServiceImpl extends ServiceImpl<NoteVersionMapper, NoteVersion> implements NoteVersionService {

    private static final int MAX_VERSIONS_PER_NOTE = 30;
    private static final long AUTO_VERSION_INTERVAL_MINUTES = 5;
    private static final int CONTENT_PREVIEW_LENGTH = 500;

    @Autowired
    private NoteMapper noteMapper;

    /**
     * 校验父笔记是否存在且未被逻辑删除
     */
    private Note checkParentNote(Long noteId) {
        Note note = noteMapper.selectById(noteId);
        if (note == null || !UserContext.getUserId().equals(note.getUserId())) {
            return null;
        }
        return note;
    }

    @Override
    public List<NoteVersion> listVersions(Long noteId) {
        // 校验父笔记存在且未删除
        if (checkParentNote(noteId) == null) {
            return List.of();
        }

        LambdaQueryWrapper<NoteVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteVersion::getNoteId, noteId)
               .eq(NoteVersion::getUserId, UserContext.getUserId())
               .orderByDesc(NoteVersion::getCreateTime);
        List<NoteVersion> versions = list(wrapper);

        // 列表只返回内容摘要，减少响应体积
        for (NoteVersion v : versions) {
            if (v.getContent() != null && v.getContent().length() > CONTENT_PREVIEW_LENGTH) {
                v.setContent(v.getContent().substring(0, CONTENT_PREVIEW_LENGTH) + "...");
            }
        }
        return versions;
    }

    @Override
    public NoteVersion getVersion(Long noteId, Long versionId) {
        // 校验父笔记存在且未删除
        if (checkParentNote(noteId) == null) {
            return null;
        }

        NoteVersion version = getById(versionId);
        if (version == null || !version.getNoteId().equals(noteId)
                || !UserContext.getUserId().equals(version.getUserId())) {
            return null;
        }
        return version;
    }

    @Override
    @Transactional
    public NoteVersion saveVersion(Long noteId) {
        Note note = checkParentNote(noteId);
        if (note == null) {
            return null;
        }

        NoteVersion version = new NoteVersion();
        version.setNoteId(noteId);
        version.setUserId(UserContext.getUserId());
        version.setTitle(note.getTitle());
        version.setContent(note.getContent());
        version.setTags(note.getTags());
        version.setFolderId(note.getFolderId());
        version.setIsPinned(note.getIsPinned());
        save(version);

        trimVersions(noteId);
        return version;
    }

    @Override
    @Transactional
    public int restoreVersion(Long noteId, Long versionId) {
        // 先查版本，再校验父笔记，减少一次 DB 查询
        NoteVersion version = getById(versionId);
        if (version == null || !version.getNoteId().equals(noteId)
                || !UserContext.getUserId().equals(version.getUserId())) {
            return -2; // 版本不存在
        }

        Note note = checkParentNote(noteId);
        if (note == null) {
            return -1; // 笔记不存在
        }

        // 恢复前先保存当前内容为版本
        NoteVersion snapshot = new NoteVersion();
        snapshot.setNoteId(noteId);
        snapshot.setUserId(UserContext.getUserId());
        snapshot.setTitle(note.getTitle());
        snapshot.setContent(note.getContent());
        snapshot.setTags(note.getTags());
        snapshot.setFolderId(note.getFolderId());
        snapshot.setIsPinned(note.getIsPinned());
        save(snapshot);

        // 恢复版本内容到笔记
        note.setTitle(version.getTitle());
        note.setContent(version.getContent());
        note.setTags(version.getTags());
        note.setFolderId(version.getFolderId());
        note.setIsPinned(version.getIsPinned());
        noteMapper.updateById(note);

        trimVersions(noteId);
        return 0;
    }

    @Override
    public void autoSaveVersion(Long noteId, String oldTitle, String oldContent,
                                String oldTags, Long oldFolderId, Integer oldIsPinned,
                                String newContent) {
        // 新旧内容没变化，直接跳过
        if (nullSafeEquals(oldContent, newContent)) {
            return;
        }

        // 查找该笔记最近一个版本
        LambdaQueryWrapper<NoteVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteVersion::getNoteId, noteId)
               .eq(NoteVersion::getUserId, UserContext.getUserId())
               .orderByDesc(NoteVersion::getCreateTime)
               .last("LIMIT 1");
        List<NoteVersion> recent = list(wrapper);

        if (!recent.isEmpty()) {
            NoteVersion last = recent.get(0);
            // 旧内容和最近版本内容一样，跳过（避免重复保存）
            if (nullSafeEquals(oldContent, last.getContent()) && nullSafeEquals(oldTitle, last.getTitle())) {
                return;
            }
            // 距离上次版本不足 5 分钟，跳过
            if (last.getCreateTime() != null) {
                long minutes = ChronoUnit.MINUTES.between(last.getCreateTime(), LocalDateTime.now());
                if (minutes < AUTO_VERSION_INTERVAL_MINUTES) {
                    return;
                }
            }
        }

        // 保存旧内容为版本
        NoteVersion version = new NoteVersion();
        version.setNoteId(noteId);
        version.setUserId(UserContext.getUserId());
        version.setTitle(oldTitle);
        version.setContent(oldContent);
        version.setTags(oldTags);
        version.setFolderId(oldFolderId);
        version.setIsPinned(oldIsPinned);
        save(version);

        trimVersions(noteId);
    }

    @Override
    public void deleteAllVersions(Long noteId) {
        baseMapper.deleteByNoteId(noteId);
    }

    /**
     * 每篇笔记最多保留 MAX_VERSIONS_PER_NOTE 个版本，删除最旧的
     * 使用 SQL 直接删除，避免全量加载到内存
     */
    private void trimVersions(Long noteId) {
        baseMapper.trimOldVersions(noteId, MAX_VERSIONS_PER_NOTE);
    }

    private boolean nullSafeEquals(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }
}
