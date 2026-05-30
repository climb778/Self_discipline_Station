CREATE DATABASE IF NOT EXISTS self_discipline_station
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE self_discipline_station;

-- 笔记文件夹表
CREATE TABLE IF NOT EXISTS `note_folder` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT       NOT NULL DEFAULT 1 COMMENT '用户 ID',
    `parent_id`   BIGINT       NOT NULL DEFAULT 0 COMMENT '父级文件夹 ID，0 表示根目录',
    `name`        VARCHAR(100) NOT NULL COMMENT '文件夹名称',
    `sort_order`  INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记文件夹';

-- 笔记表
CREATE TABLE IF NOT EXISTS `note` (
    `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT        NOT NULL DEFAULT 1 COMMENT '用户 ID',
    `folder_id`   BIGINT        DEFAULT NULL COMMENT '文件夹 ID，为空表示未分类',
    `title`       VARCHAR(200)  NOT NULL COMMENT '笔记标题',
    `content`     MEDIUMTEXT    COMMENT 'Markdown 原文内容',
    `summary`     VARCHAR(500)  DEFAULT NULL COMMENT '摘要',
    `tags`        VARCHAR(500)  DEFAULT NULL COMMENT '标签，逗号分隔',
    `is_deleted`  TINYINT       NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 删除',
    `is_pinned`   TINYINT       NOT NULL DEFAULT 0 COMMENT '是否置顶：0 否，1 是',
    `create_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_folder_id` (`folder_id`),
    INDEX `idx_is_deleted` (`is_deleted`),
    INDEX `idx_update_time` (`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记';
