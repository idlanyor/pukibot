-- AlterTable
ALTER TABLE `packages` MODIFY `docker_image` TEXT NULL,
    MODIFY `startup_command` TEXT NULL,
    MODIFY `environment` TEXT NULL,
    MODIFY `limits` TEXT NULL,
    MODIFY `feature_limits` TEXT NULL;
