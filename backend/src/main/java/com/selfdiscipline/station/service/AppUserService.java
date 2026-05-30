package com.selfdiscipline.station.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.selfdiscipline.station.entity.AppUser;

public interface AppUserService extends IService<AppUser> {

    AppUser findByUsername(String username);

    boolean checkPassword(AppUser user, String rawPassword);

    void changePassword(Long userId, String oldPassword, String newPassword);

    AppUser register(String username, String password, String nickname);
}
