-- 笔记版本历史表
CREATE TABLE IF NOT EXISTS `note_version` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `note_id` BIGINT NOT NULL COMMENT '笔记 ID',
  `user_id` BIGINT NOT NULL DEFAULT 1 COMMENT '用户 ID',
  `title` VARCHAR(255) DEFAULT NULL COMMENT '当时标题',
  `content` MEDIUMTEXT COMMENT '当时 Markdown 原文',
  `tags` VARCHAR(500) DEFAULT NULL COMMENT '当时标签',
  `folder_id` BIGINT DEFAULT NULL COMMENT '当时文件夹 ID',
  `is_pinned` TINYINT DEFAULT 0 COMMENT '当时是否置顶',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '版本创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_note_id` (`note_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='笔记版本历史';
