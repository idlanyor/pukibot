-- CreateTable
CREATE TABLE `packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `ram` VARCHAR(191) NOT NULL,
    `cpu` VARCHAR(191) NOT NULL,
    `storage` VARCHAR(191) NOT NULL,
    `bandwidth` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `emoji` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `egg_id` INTEGER NULL,
    `docker_image` VARCHAR(191) NULL,
    `startup_command` VARCHAR(191) NULL,
    `environment` VARCHAR(191) NULL,
    `limits` VARCHAR(191) NULL,
    `feature_limits` VARCHAR(191) NULL,
    `node_id` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `packages_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NOT NULL,
    `customer_name` VARCHAR(191) NULL,
    `customer_chat_id` VARCHAR(191) NOT NULL,
    `package_type` VARCHAR(191) NOT NULL,
    `package_duration` INTEGER NOT NULL,
    `package_price` INTEGER NOT NULL,
    `package_specs` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `total_amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `admin_notes` VARCHAR(191) NULL,
    `payment_proof` VARCHAR(191) NULL,
    `server_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `orders_customer_phone_idx`(`customer_phone`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_package_type_idx`(`package_type`),
    INDEX `orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `updated_by` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_status_history_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(191) NOT NULL,
    `server_id` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NOT NULL,
    `package_type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `subscriptions_customer_phone_idx`(`customer_phone`),
    INDEX `subscriptions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `server_monitoring` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `server_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `resources` VARCHAR(191) NULL,
    `limits` VARCHAR(191) NULL,
    `last_check` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `server_monitoring_server_id_idx`(`server_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_package_type_fkey` FOREIGN KEY (`package_type`) REFERENCES `packages`(`type`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_package_type_fkey` FOREIGN KEY (`package_type`) REFERENCES `packages`(`type`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `server_monitoring` ADD CONSTRAINT `server_monitoring_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
