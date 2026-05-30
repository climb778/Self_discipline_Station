package com.selfdiscipline.station;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.selfdiscipline.station.mapper")
public class SelfDisciplineStationApplication {

    public static void main(String[] args) {
        SpringApplication.run(SelfDisciplineStationApplication.class, args);
    }
}
