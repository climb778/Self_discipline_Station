package com.selfdiscipline.station.controller;

import com.selfdiscipline.station.common.Result;
import com.selfdiscipline.station.entity.NoteVersion;
import com.selfdiscipline.station.service.NoteVersionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes/{noteId}/versions")
public class NoteVersionController {

    private final NoteVersionService versionService;

    public NoteVersionController(NoteVersionService versionService) {
        this.versionService = versionService;
    }

    /**
     * 查询版本列表
     * GET /api/notes/{noteId}/versions
     */
    @GetMapping
    public Result<List<NoteVersion>> list(@PathVariable Long noteId) {
        List<NoteVersion> versions = versionService.listVersions(noteId);
        return Result.ok(versions);
    }

    /**
     * 查询版本详情
     * GET /api/notes/{noteId}/versions/{versionId}
     */
    @GetMapping("/{versionId}")
    public Result<NoteVersion> detail(@PathVariable Long noteId, @PathVariable Long versionId) {
        NoteVersion version = versionService.getVersion(noteId, versionId);
        if (version == null) {
            return Result.fail(404, "版本不存在");
        }
        return Result.ok(version);
    }

    /**
     * 手动保存版本快照
     * POST /api/notes/{noteId}/versions
     */
    @PostMapping
    public Result<NoteVersion> create(@PathVariable Long noteId) {
        NoteVersion version = versionService.saveVersion(noteId);
        if (version == null) {
            return Result.fail(404, "笔记不存在");
        }
        return Result.ok("版本已保存", version);
    }

    /**
     * 恢复指定版本
     * PUT /api/notes/{noteId}/versions/{versionId}/restore
     */
    @PutMapping("/{versionId}/restore")
    public Result<Void> restore(@PathVariable Long noteId, @PathVariable Long versionId) {
        int result = versionService.restoreVersion(noteId, versionId);
        if (result == -1) {
            return Result.fail(404, "笔记不存在");
        }
        if (result == -2) {
            return Result.fail(404, "版本不存在");
        }
        return Result.ok("恢复成功", null);
    }
}
