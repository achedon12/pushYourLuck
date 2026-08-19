-- CreateTable
CREATE TABLE `Score` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `game` VARCHAR(48) NOT NULL,
    `mode` VARCHAR(16) NOT NULL,
    `dayKey` VARCHAR(16) NOT NULL DEFAULT '',
    `name` VARCHAR(20) NOT NULL,
    `score` INTEGER NOT NULL,
    `rounds` INTEGER NOT NULL DEFAULT 0,
    `clientId` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Score_game_mode_dayKey_score_idx`(`game`, `mode`, `dayKey`, `score` DESC),
    UNIQUE INDEX `Score_game_mode_dayKey_clientId_key`(`game`, `mode`, `dayKey`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

