import { WASocket } from '@whiskeysockets/baileys';
import { Order, OrderStatus, PACKAGE_CATALOG } from './models/Order';
import { Logger } from '../../utils/logger';
import { ConnectionManager } from '../../utils/connectionManager';

export class NotificationService {
    private static instance: NotificationService;

    private constructor() {}

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async notifyOrderCreated(socket: WASocket, order: Order): Promise<void> {
        try {
            // Notify customer
            await this.sendCustomerOrderCreatedNotification(socket, order);
            
            // Notify admin
            await this.sendAdminOrderCreatedNotification(socket, order);
            
            Logger.info(`📢 Sent order created notifications for order ${order.id}`);
        } catch (error) {
            Logger.error('❌ Failed to send order created notifications:', error);
        }
    }

    async notifyOrderStatusChanged(socket: WASocket, order: Order, previousStatus: OrderStatus): Promise<void> {
        try {
            // Notify customer about status change
            await this.sendCustomerStatusChangeNotification(socket, order, previousStatus);
            
            // Notify admin if needed
            if (this.shouldNotifyAdminForStatusChange(order.status)) {
                await this.sendAdminStatusChangeNotification(socket, order, previousStatus);
            }
            
            Logger.info(`📢 Sent status change notifications for order ${order.id}: ${previousStatus} -> ${order.status}`);
        } catch (error) {
            Logger.error('❌ Failed to send status change notifications:', error);
        }
    }

    private async sendCustomerOrderCreatedNotification(socket: WASocket, order: Order): Promise<void> {
        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        
        const message = `📝 *Pesanan Berhasil Dibuat!*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n` +
                       `⏰ Durasi: ${order.item.duration} bulan\n` +
                       `💰 Total: ${order.currency} ${order.totalAmount.toLocaleString('id-ID')}\n` +
                       `📅 Tanggal: ${order.createdAt.toLocaleDateString('id-ID')}\n\n` +
                       `⏳ Status: Menunggu konfirmasi admin\n\n` +
                       `💬 Admin akan segera menghubungi Anda untuk konfirmasi pembayaran.\n` +
                       `📞 Hubungi admin: wa.me/${process.env.STORE_ADMIN}\n\n` +
                       `💡 Simpan Order ID ini untuk tracking pesanan Anda.`;

        await this.safeMessageSend(socket, order.customer.chatId, message);
    }

    private async sendAdminOrderCreatedNotification(socket: WASocket, order: Order): Promise<void> {
        if (!process.env.STORE_ADMIN) return;

        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        
        const message = `🔔 *Pesanan Baru Masuk!*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `👤 Customer: ${order.customer.phoneNumber}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n` +
                       `⏰ Durasi: ${order.item.duration} bulan\n` +
                       `💰 Total: ${order.currency} ${order.totalAmount.toLocaleString('id-ID')}\n` +
                       `📅 Waktu: ${order.createdAt.toLocaleString('id-ID')}\n\n` +
                       `🔧 Gunakan: .order-confirm ${order.id} untuk konfirmasi\n` +
                       `📋 Detail: .order-detail ${order.id}`;

        const adminChatId = `${process.env.STORE_ADMIN}@s.whatsapp.net`;
        await this.safeMessageSend(socket, adminChatId, message);
    }

    private async sendCustomerStatusChangeNotification(socket: WASocket, order: Order, previousStatus: OrderStatus): Promise<void> {
        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        const statusMessage = this.getStatusMessage(order.status);
        const statusIcon = this.getStatusIcon(order.status);
        
        let message = `${statusIcon} *Status Pesanan Diperbarui*\n\n` +
                     `🆔 Order ID: ${order.id}\n` +
                     `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n` +
                     `🔄 Status: ${statusMessage}\n` +
                     `📅 Diperbarui: ${order.updatedAt.toLocaleString('id-ID')}\n\n`;

        // Add status-specific messages
        switch (order.status) {
            case OrderStatus.CONFIRMED:
                message += `✅ Pesanan Anda telah dikonfirmasi!\n` +
                          `💳 Silakan lakukan pembayaran sesuai instruksi admin.\n` +
                          `📞 Hubungi admin: wa.me/${process.env.STORE_ADMIN}`;
                break;
            case OrderStatus.PROCESSING:
                message += `🔄 Server sedang disetup untuk Anda!\n` +
                          `⏱️ Proses ini biasanya memakan waktu 5-15 menit.\n` +
                          `📧 Detail akses akan dikirim setelah selesai.`;
                break;
            case OrderStatus.COMPLETED:
                message += `🎉 Server Anda sudah siap digunakan!\n` +
                          `🖥️ Detail akses telah dikirim.\n` +
                          `💬 Jika ada kendala, hubungi admin: wa.me/${process.env.STORE_ADMIN}`;
                break;
            case OrderStatus.CANCELLED:
                message += `❌ Pesanan telah dibatalkan.\n` +
                          `💬 Jika ada pertanyaan, hubungi admin: wa.me/${process.env.STORE_ADMIN}`;
                break;
            case OrderStatus.REFUNDED:
                message += `💰 Refund telah diproses.\n` +
                          `🏦 Dana akan dikembalikan dalam 1-3 hari kerja.\n` +
                          `💬 Hubungi admin jika ada pertanyaan: wa.me/${process.env.STORE_ADMIN}`;
                break;
        }

        if (order.notes) {
            message += `\n\n📝 Catatan: ${order.notes}`;
        }

        await this.safeMessageSend(socket, order.customer.chatId, message);
    }

    private async sendAdminStatusChangeNotification(socket: WASocket, order: Order, previousStatus: OrderStatus): Promise<void> {
        if (!process.env.STORE_ADMIN) return;

        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        const latestHistory = order.statusHistory[order.statusHistory.length - 1];
        
        const message = `📊 *Status Order Diperbarui*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `👤 Customer: ${order.customer.phoneNumber}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n` +
                       `🔄 Status: ${previousStatus} → ${order.status}\n` +
                       `👨‍💼 Diperbarui oleh: ${latestHistory.updatedBy}\n` +
                       `📅 Waktu: ${order.updatedAt.toLocaleString('id-ID')}` +
                       (latestHistory.notes ? `\n📝 Catatan: ${latestHistory.notes}` : '');

        const adminChatId = `${process.env.STORE_ADMIN}@s.whatsapp.net`;
        await this.safeMessageSend(socket, adminChatId, message);
    }

    async sendCustomOrderNotification(socket: WASocket, chatId: string, message: string): Promise<void> {
        await this.safeMessageSend(socket, chatId, message);
    }

    async sendBulkNotification(socket: WASocket, orders: Order[], message: string): Promise<void> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const order of orders) {
            try {
                const personalizedMessage = message.replace(/\{orderId\}/g, order.id)
                                                 .replace(/\{customerPhone\}/g, order.customer.phoneNumber);
                
                await this.safeMessageSend(socket, order.customer.chatId, personalizedMessage);
                results.success++;
                
                // Add delay between messages to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                results.failed++;
                results.errors.push(`${order.id}: ${error}`);
                Logger.error(`❌ Failed to send bulk notification to ${order.customer.phoneNumber}:`, error);
            }
        }

        Logger.info(`📢 Bulk notification sent: ${results.success} success, ${results.failed} failed`);
        
        // Notify admin about bulk notification results
        if (process.env.STORE_ADMIN) {
            const resultMessage = `📊 *Bulk Notification Results*\n\n` +
                                 `✅ Berhasil: ${results.success}\n` +
                                 `❌ Gagal: ${results.failed}\n` +
                                 `📋 Total: ${orders.length}` +
                                 (results.errors.length > 0 ? `\n\n🚨 Errors:\n${results.errors.slice(0, 5).join('\n')}` : '');
            
            const adminChatId = `${process.env.STORE_ADMIN}@s.whatsapp.net`;
            await this.safeMessageSend(socket, adminChatId, resultMessage);
        }
    }

    async notifyServerProvisioned(socket: WASocket, order: Order, credentials: any): Promise<void> {
        try {
            // Send comprehensive server credentials to customer
            await this.sendServerCredentialsNotification(socket, order, credentials);
            
            // Notify admin about successful provisioning
            await this.sendAdminProvisioningNotification(socket, order, credentials);
            
            Logger.info(`📢 Sent server provisioning notifications for order ${order.id}`);
        } catch (error) {
            Logger.error('❌ Failed to send server provisioning notifications:', error);
        }
    }

    private async sendServerCredentialsNotification(socket: WASocket, order: Order, credentials: any): Promise<void> {
        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        
        const message = `🎉 *Server Anda Sudah Siap!*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n` +
                       `🖥️ Server: ${credentials.serverName}\n\n` +
                       `🔐 *Informasi Login Panel:*\n` +
                       `🌐 URL: ${credentials.panelUrl}\n` +
                       `👤 Username: ${credentials.username}\n` +
                       `🔑 Password: ${credentials.password}\n` +
                       `📧 Email: ${credentials.email}\n\n` +
                       `🎮 *Informasi Server:*\n` +
                       `🆔 Server ID: ${credentials.serverId}\n` +
                       `💾 RAM: ${packageInfo.ram}\n` +
                       `🖥️ CPU: ${packageInfo.cpu}\n` +
                       `💽 Storage: ${packageInfo.storage}\n` +
                       `🌐 Bandwidth: ${packageInfo.bandwidth}\n\n` +
                       `📋 *Cara Menggunakan:*\n` +
                       `1. Buka ${credentials.panelUrl}\n` +
                       `2. Login dengan username dan password di atas\n` +
                       `3. Pilih server Anda dari dashboard\n` +
                       `4. Klik "Start" untuk menjalankan server\n` +
                       `5. Upload file server game Anda\n\n` +
                       `⚠️ *Penting:*\n` +
                       `• Simpan informasi login ini dengan aman\n` +
                       `• Jangan bagikan password kepada orang lain\n` +
                       `• Backup data server Anda secara berkala\n\n` +
                       `💬 Butuh bantuan? Hubungi admin: wa.me/${process.env.STORE_ADMIN}\n\n` +
                       `🙏 Terima kasih telah menggunakan layanan kami!`;

        await this.safeMessageSend(socket, order.customer.chatId, message);
    }

    private async sendAdminProvisioningNotification(socket: WASocket, order: Order, credentials: any): Promise<void> {
        if (!process.env.STORE_ADMIN) return;

        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        
        const message = `✅ *Auto-Provisioning Berhasil!*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `👤 Customer: ${order.customer.phoneNumber}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n` +
                       `🖥️ Server: ${credentials.serverName}\n\n` +
                       `🔐 *Credentials Created:*\n` +
                       `👤 Username: ${credentials.username}\n` +
                       `📧 Email: ${credentials.email}\n` +
                       `🆔 Server ID: ${credentials.serverId}\n\n` +
                       `📅 Provisioned: ${new Date().toLocaleString('id-ID')}\n` +
                       `🎯 Status: Credentials sent to customer`;

        const adminChatId = `${process.env.STORE_ADMIN}@s.whatsapp.net`;
        await this.safeMessageSend(socket, adminChatId, message);
    }

    async notifyProvisioningFailed(socket: WASocket, order: Order, error: string): Promise<void> {
        try {
            // Notify customer about provisioning failure
            await this.sendCustomerProvisioningFailedNotification(socket, order, error);
            
            // Notify admin about provisioning failure
            await this.sendAdminProvisioningFailedNotification(socket, order, error);
            
            Logger.info(`📢 Sent provisioning failure notifications for order ${order.id}`);
        } catch (notificationError) {
            Logger.error('❌ Failed to send provisioning failure notifications:', notificationError);
        }
    }

    private async sendCustomerProvisioningFailedNotification(socket: WASocket, order: Order, error: string): Promise<void> {
        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        
        const message = `⚠️ *Proses Setup Server Tertunda*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n\n` +
                       `🔄 Server Anda sedang dalam proses setup manual oleh admin.\n` +
                       `⏱️ Proses ini mungkin membutuhkan waktu lebih lama dari biasanya.\n\n` +
                       `📧 Admin akan mengirimkan detail akses server segera setelah setup selesai.\n\n` +
                       `💬 Untuk informasi lebih lanjut, hubungi admin: wa.me/${process.env.STORE_ADMIN}\n\n` +
                       `🙏 Terima kasih atas kesabaran Anda!`;

        await this.safeMessageSend(socket, order.customer.chatId, message);
    }

    private async sendAdminProvisioningFailedNotification(socket: WASocket, order: Order, error: string): Promise<void> {
        if (!process.env.STORE_ADMIN) return;

        const packageInfo = PACKAGE_CATALOG[order.item.packageType];
        
        const message = `❌ *Auto-Provisioning Gagal!*\n\n` +
                       `🆔 Order ID: ${order.id}\n` +
                       `👤 Customer: ${order.customer.phoneNumber}\n` +
                       `📦 Paket: ${packageInfo.emoji} ${packageInfo.name}\n\n` +
                       `🚨 *Error:*\n${error}\n\n` +
                       `🔧 *Tindakan Diperlukan:*\n` +
                       `• Cek konfigurasi Pterodactyl Admin API\n` +
                       `• Periksa ketersediaan resource\n` +
                       `• Lakukan provisioning manual jika diperlukan\n\n` +
                       `📋 Gunakan: .provision-retry ${order.id} untuk mencoba lagi\n` +
                       `🛠️ Atau: .order-complete ${order.id} [server-id] untuk manual completion`;

        const adminChatId = `${process.env.STORE_ADMIN}@s.whatsapp.net`;
        await this.safeMessageSend(socket, adminChatId, message);
    }

    private shouldNotifyAdminForStatusChange(status: OrderStatus): boolean {
        // Notify admin for important status changes
        return [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(status);
    }

    private getStatusMessage(status: OrderStatus): string {
        const messages = {
            [OrderStatus.PENDING]: 'Menunggu konfirmasi',
            [OrderStatus.CONFIRMED]: 'Dikonfirmasi - Menunggu pembayaran',
            [OrderStatus.PROCESSING]: 'Sedang diproses',
            [OrderStatus.COMPLETED]: 'Selesai',
            [OrderStatus.CANCELLED]: 'Dibatalkan',
            [OrderStatus.REFUNDED]: 'Dikembalikan'
        };
        return messages[status] || status;
    }

    private getStatusIcon(status: OrderStatus): string {
        const icons = {
            [OrderStatus.PENDING]: '⏳',
            [OrderStatus.CONFIRMED]: '✅',
            [OrderStatus.PROCESSING]: '🔄',
            [OrderStatus.COMPLETED]: '🎉',
            [OrderStatus.CANCELLED]: '❌',
            [OrderStatus.REFUNDED]: '💰'
        };
        return icons[status] || '❓';
    }

    private async safeMessageSend(socket: WASocket, chatId: string, message: string): Promise<void> {
        await ConnectionManager.safeMessageSend(
            async () => {
                await socket.sendMessage(chatId, { text: message });
            },
            `send notification to ${chatId}`
        );
    }
}