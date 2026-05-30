package com.selfdiscipline.station.controller;

import com.selfdiscipline.station.common.Result;
import com.selfdiscipline.station.dto.FolderCreateDTO;
import com.selfdiscipline.station.dto.FolderUpdateDTO;
import com.selfdiscipline.station.entity.NoteFolder;
import com.selfdiscipline.station.service.NoteFolderService;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/note-folders")
public class NoteFolderController {

    private final NoteFolderService folderService;

    public NoteFolderController(NoteFolderService folderService) {
        this.folderService = folderService;
    }

    /**
     * 查询文件夹列表
     * GET /api/note-folders
     */
    @GetMapping
    public Result<List<NoteFolder>> list() {
        List<NoteFolder> folders = folderService.listFolders();
        return Result.ok(folders);
    }

    /**
     * 新增文件夹
     * POST /api/note-folders
     */
    @PostMapping
    public Result<NoteFolder> create(@Valid @RequestBody FolderCreateDTO dto) {
        NoteFolder folder = folderService.createFolder(dto);
        return Result.ok("创建成功", folder);
    }

    /**
     * 修改文件夹名称
     * PUT /api/note-folders/{id}
     */
    @PutMapping("/{id}")
    public Result<NoteFolder> update(@PathVariable Long id, @Valid @RequestBody FolderUpdateDTO dto) {
        NoteFolder folder = folderService.updateFolder(id, dto);
        if (folder == null) {
            return Result.fail(404, "文件夹不存在");
        }
        return Result.ok("修改成功", folder);
    }

    /**
     * 删除文件夹（相关笔记的 folder_id 会置空，子文件夹的 parent_id 归零）
     * DELETE /api/note-folders/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        NoteFolder folder = folderService.getFolderById(id);
        if (folder == null) {
            return Result.fail(404, "文件夹不存在");
        }
        folderService.deleteFolder(id);
        return Result.ok("删除成功", null);
    }
}
