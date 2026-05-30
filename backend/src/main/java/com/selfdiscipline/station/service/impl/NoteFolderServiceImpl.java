package com.selfdiscipline.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.selfdiscipline.station.dto.FolderCreateDTO;
import com.selfdiscipline.station.dto.FolderUpdateDTO;
import com.selfdiscipline.station.entity.Note;
import com.selfdiscipline.station.entity.NoteFolder;
import com.selfdiscipline.station.mapper.NoteFolderMapper;
import com.selfdiscipline.station.mapper.NoteMapper;
import com.selfdiscipline.station.service.NoteFolderService;
import com.selfdiscipline.station.util.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoteFolderServiceImpl extends ServiceImpl<NoteFolderMapper, NoteFolder> implements NoteFolderService {

    private final NoteMapper noteMapper;

    public NoteFolderServiceImpl(NoteMapper noteMapper) {
        this.noteMapper = noteMapper;
    }

    @Override
    public List<NoteFolder> listFolders() {
        LambdaQueryWrapper<NoteFolder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NoteFolder::getUserId, UserContext.getUserId())
                .orderByAsc(NoteFolder::getSortOrder)
                .orderByDesc(NoteFolder::getCreateTime);
        return list(wrapper);
    }

    @Override
    public NoteFolder getFolderById(Long id) {
        NoteFolder folder = getById(id);
        if (folder == null || !UserContext.getUserId().equals(folder.getUserId())) {
            return null;
        }
        return folder;
    }

    @Override
    public NoteFolder createFolder(FolderCreateDTO dto) {
        NoteFolder folder = new NoteFolder();
        folder.setUserId(UserContext.getUserId());
        folder.setName(dto.getName());
        folder.setParentId(dto.getParentId() != null ? dto.getParentId() : 0L);
        folder.setSortOrder(0);
        save(folder);
        return folder;
    }

    @Override
    public NoteFolder updateFolder(Long id, FolderUpdateDTO dto) {
        NoteFolder folder = getById(id);
        if (folder == null || !UserContext.getUserId().equals(folder.getUserId())) {
            return null;
        }
        folder.setName(dto.getName());
        updateById(folder);
        return folder;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFolder(Long id) {
        NoteFolder folder = getById(id);
        if (folder == null || !UserContext.getUserId().equals(folder.getUserId())) {
            return;
        }

        // 将该文件夹下所有笔记的 folder_id 置空
        LambdaUpdateWrapper<Note> noteUpdate = new LambdaUpdateWrapper<>();
        noteUpdate.eq(Note::getFolderId, id)
                .eq(Note::getUserId, UserContext.getUserId())
                .set(Note::getFolderId, null);
        noteMapper.update(null, noteUpdate);

        // 将子文件夹的 parent_id 归零（提升为根目录）
        LambdaUpdateWrapper<NoteFolder> folderUpdate = new LambdaUpdateWrapper<>();
        folderUpdate.eq(NoteFolder::getParentId, id)
                .eq(NoteFolder::getUserId, UserContext.getUserId())
                .set(NoteFolder::getParentId, 0L);
        update(null, folderUpdate);

        // 删除文件夹
        removeById(id);
    }
}
