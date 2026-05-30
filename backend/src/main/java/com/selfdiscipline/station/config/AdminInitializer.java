package com.selfdiscipline.station.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.selfdiscipline.station.entity.AppUser;
import com.selfdiscipline.station.service.AppUserService;
import com.selfdiscipline.station.service.impl.AppUserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private AppUserService appUserService;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.nickname}")
    private String adminNickname;

    @Override
    public void run(String... args) {
        long count = appUserService.count();
        if (count > 0) {
            return;
        }

        // 表为空，插入 id=1 的管理员，保证与旧笔记 user_id=1 兼容
        AppUser admin = new AppUser();
        admin.setId(1L);
        admin.setUsername(adminUsername);
        admin.setPasswordHash(AppUserServiceImpl.encodePassword(adminPassword));
        admin.setNickname(adminNickname);
        admin.setStatus(1);
        appUserService.save(admin);

        // 验证插入后的 id 确实为 1
        AppUser saved = appUserService.getById(1L);
        if (saved == null || !adminUsername.equals(saved.getUsername())) {
            throw new RuntimeException(
                    "初始化管理员失败：app_user 插入后 id 不为 1。"
                    + "请手动执行 SQL: INSERT INTO app_user (id, username, password_hash, nickname, status) "
                    + "VALUES (1, 'admin', '<BCrypt hash>', '管理员', 1);"
                    + "然后重启后端。"
            );
        }

        System.out.println("========================================");
        System.out.println("已自动创建默认管理员: " + adminUsername);
        System.out.println("请尽快修改默认密码！");
        System.out.println("========================================");
    }
}
