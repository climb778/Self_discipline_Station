package com.selfdiscipline.station.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.selfdiscipline.station.entity.NoteVersion;

import java.util.List;

public interface NoteVersionService extends IService<NoteVersion> {

    /**
     * 查询某篇笔记的版本列表（按创建时间倒序）
     */
    List<NoteVersion> listVersions(Long noteId);

    /**
     * 查询某个版本详情
     */
    NoteVersion getVersion(Long noteId, Long versionId);

    /**
     * 手动保存当前笔记快照为版本
     * @return 创建的版本，如果笔记不存在返回 null
     */
    NoteVersion saveVersion(Long noteId);

    /**
     * 恢复指定版本到当前笔记
     * @return 0=成功, -1=笔记不存在, -2=版本不存在
     */
    int restoreVersion(Long noteId, Long versionId);

    /**
     * 自动版本策略：在笔记更新前调用
     * 如果距离上次版本超过 5 分钟且内容有变化，则保存旧内容为版本
     */
    void autoSaveVersion(Long noteId, String oldTitle, String oldContent,
                         String oldTags, Long oldFolderId, Integer oldIsPinned,
                         String newContent);

    /**
     * 删除指定笔记的所有版本（彻底删除笔记时调用）
     */
    void deleteAllVersions(Long noteId);
}
