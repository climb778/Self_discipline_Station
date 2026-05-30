package com.selfdiscipline.station.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.selfdiscipline.station.dto.NoteCreateDTO;
import com.selfdiscipline.station.dto.NoteUpdateDTO;
import com.selfdiscipline.station.entity.Note;
import java.util.List;
import java.util.Map;

public interface NoteService extends IService<Note> {

    /**
     * 查询笔记列表（支持关键字、文件夹、标签、置顶、排序筛选）
     */
    List<Note> listNotes(String keyword, Long folderId, String tag, Integer pinned, String sort);

    /**
     * 查询标签统计：[{name: "Java", count: 5}, ...]
     */
    List<Map<String, Object>> getTagStats();

    /**
     * 批量归一化历史标签数据，返回更新的笔记数
     */
    int normalizeAllTags();

    /**
     * 查询笔记详情
     */
    Note getNoteById(Long id);

    /**
     * 新增笔记
     */
    Note createNote(NoteCreateDTO dto);

    /**
     * 修改笔记
     */
    Note updateNote(Long id, NoteUpdateDTO dto);

    /**
     * 逻辑删除笔记
     */
    void deleteNote(Long id);

    /**
     * 查询回收站笔记列表
     */
    List<Note> listTrashNotes();

    /**
     * 恢复笔记
     * @return 是否恢复成功
     */
    boolean restoreNote(Long id);

    /**
     * 彻底删除笔记（物理删除）
     * @return 0=笔记未在回收站，1=删除成功
     */
    int permanentDeleteNote(Long id);
}
