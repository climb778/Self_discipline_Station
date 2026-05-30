package com.selfdiscipline.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.selfdiscipline.station.entity.AppUser;
import com.selfdiscipline.station.mapper.AppUserMapper;
import com.selfdiscipline.station.service.AppUserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AppUserServiceImpl extends ServiceImpl<AppUserMapper, AppUser> implements AppUserService {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    @Override
    public AppUser findByUsername(String username) {
        return getOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getUsername, username)
                .last("LIMIT 1"));
    }

    @Override
    public boolean checkPassword(AppUser user, String rawPassword) {
        return ENCODER.matches(rawPassword, user.getPasswordHash());
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        AppUser user = getById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        if (!ENCODER.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("旧密码不正确");
        }
        user.setPasswordHash(ENCODER.encode(newPassword));
        updateById(user);
    }

    @Override
    public AppUser register(String username, String password, String nickname) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(ENCODER.encode(password));
        user.setNickname(nickname != null && !nickname.trim().isEmpty() ? nickname.trim() : username);
        user.setStatus(1);
        save(user);
        return user;
    }

    public static String encodePassword(String raw) {
        return ENCODER.encode(raw);
    }
}
