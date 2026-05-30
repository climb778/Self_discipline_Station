package com.selfdiscipline.station.controller;

import com.selfdiscipline.station.common.Result;
import com.selfdiscipline.station.dto.NoteCreateDTO;
import com.selfdiscipline.station.dto.NoteUpdateDTO;
import com.selfdiscipline.station.entity.Note;
import com.selfdiscipline.station.service.NoteService;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    /**
     * 查询笔记列表
     * GET /api/notes?keyword=xxx&folderId=1&tag=Java&pinned=1&sort=updateTime
     */
    @GetMapping
    public Result<List<Note>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Integer pinned,
            @RequestParam(required = false) String sort) {
        List<Note> notes = noteService.listNotes(keyword, folderId, tag, pinned, sort);
        return Result.ok(notes);
    }

    /**
     * 获取标签统计
     * GET /api/notes/tags
     */
    @GetMapping("/tags")
    public Result<List<Map<String, Object>>> tags() {
        return Result.ok(noteService.getTagStats());
    }

    /**
     * 批量归一化历史标签（去除空格、去重）
     * POST /api/notes/normalize-tags
     */
    @PostMapping("/normalize-tags")
    public Result<Map<String, Object>> normalizeTags() {
        int updated = noteService.normalizeAllTags();
        Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("updated", updated);
        return Result.ok("归一化完成", data);
    }

    /**
     * 查询笔记详情
     * GET /api/notes/{id}
     */
    @GetMapping("/{id}")
    public Result<Note> detail(@PathVariable Long id) {
        Note note = noteService.getNoteById(id);
        if (note == null) {
            return Result.fail(404, "笔记不存在");
        }
        return Result.ok(note);
    }

    /**
     * 新增笔记
     * POST /api/notes
     */
    @PostMapping
    public Result<Note> create(@Valid @RequestBody NoteCreateDTO dto) {
        Note note = noteService.createNote(dto);
        return Result.ok("创建成功", note);
    }

    /**
     * 修改笔记
     * PUT /api/notes/{id}
     */
    @PutMapping("/{id}")
    public Result<Note> update(@PathVariable Long id, @RequestBody NoteUpdateDTO dto) {
        Note note = noteService.updateNote(id, dto);
        if (note == null) {
            return Result.fail(404, "笔记不存在");
        }
        return Result.ok("修改成功", note);
    }

    /**
     * 逻辑删除笔记
     * DELETE /api/notes/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Note note = noteService.getNoteById(id);
        if (note == null) {
            return Result.fail(404, "笔记不存在");
        }
        noteService.deleteNote(id);
        return Result.ok("已移入回收站", null);
    }

    /**
     * 查询回收站笔记列表
     * GET /api/notes/trash
     */
    @GetMapping("/trash")
    public Result<List<Note>> trash() {
        return Result.ok(noteService.listTrashNotes());
    }

    /**
     * 恢复笔记
     * PUT /api/notes/{id}/restore
     */
    @PutMapping("/{id}/restore")
    public Result<Void> restore(@PathVariable Long id) {
        boolean ok = noteService.restoreNote(id);
        if (!ok) {
            return Result.fail(404, "笔记未在回收站中");
        }
        return Result.ok("恢复成功", null);
    }

    /**
     * 彻底删除笔记（物理删除）
     * DELETE /api/notes/{id}/permanent
     */
    @DeleteMapping("/{id}/permanent")
    public Result<Void> permanentDelete(@PathVariable Long id) {
        int result = noteService.permanentDeleteNote(id);
        if (result == 0) {
            return Result.fail(400, "笔记未在回收站中，无法彻底删除");
        }
        if (result < 0) {
            return Result.fail(500, "删除失败");
        }
        return Result.ok("彻底删除成功", null);
    }
}
