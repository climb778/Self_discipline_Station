package com.selfdiscipline.station.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.selfdiscipline.station.dto.FolderCreateDTO;
import com.selfdiscipline.station.dto.FolderUpdateDTO;
import com.selfdiscipline.station.entity.NoteFolder;
import java.util.List;

public interface NoteFolderService extends IService<NoteFolder> {

    /**
     * 查询文件夹列表（按当前登录用户过滤）
     */
    List<NoteFolder> listFolders();

    /**
     * 查询文件夹详情（校验归属）
     */
    NoteFolder getFolderById(Long id);

    /**
     * 新增文件夹
     */
    NoteFolder createFolder(FolderCreateDTO dto);

    /**
     * 修改文件夹名称
     */
    NoteFolder updateFolder(Long id, FolderUpdateDTO dto);

    /**
     * 删除文件夹，相关笔记的 folder_id 置空
     */
    void deleteFolder(Long id);
}
