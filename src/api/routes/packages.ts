import { Elysia } from 'elysia';
import { PackageService } from '../../services/PackageService';
import { Logger } from '../../utils/logger';

const packageService = PackageService.getInstance();

export const createPackageRoutes = (app: Elysia) => {
    return app.group('/packages', (app) => app
        // GET /api/packages - Get all packages
        .get('/', async ({ query }) => {
            try {
                const { category, active, priceMin, priceMax, search } = query;
                
                const filter = {
                    category: category as string,
                    active: active === 'true' ? true : active === 'false' ? false : undefined,
                    priceMin: priceMin ? parseInt(priceMin as string) : undefined,
                    priceMax: priceMax ? parseInt(priceMax as string) : undefined,
                    search: search as string
                };

                const packages = await packageService.getAllPackages(filter);
                
                return {
                    success: true,
                    data: packages,
                    total: packages.length
                };
            } catch (error) {
                Logger.error('❌ Failed to get packages:', error);
                return {
                    success: false,
                    error: 'Failed to get packages'
                };
            }
        })

        // GET /api/packages/stats - Get package statistics
        .get('/stats', async () => {
            try {
                const stats = await packageService.getPackageStats();
                
                return {
                    success: true,
                    data: stats
                };
            } catch (error) {
                Logger.error('❌ Failed to get package stats:', error);
                return {
                    success: false,
                    error: 'Failed to get package stats'
                };
            }
        })

        // GET /api/packages/:type - Get specific package
        .get('/:type', async ({ params }) => {
            try {
                const { type } = params;
                const packageData = await packageService.getPackageByType(type);
                
                if (!packageData) {
                    return {
                        success: false,
                        error: 'Package not found'
                    };
                }
                
                return {
                    success: true,
                    data: packageData
                };
            } catch (error) {
                Logger.error('❌ Failed to get package:', error);
                return {
                    success: false,
                    error: 'Failed to get package'
                };
            }
        })

        // POST /api/packages - Create new package
        .post('/', async ({ body }) => {
            try {
                const packageData = body as any;
                
                // Validate required fields
                const requiredFields = ['type', 'name', 'ram', 'cpu', 'storage', 'bandwidth', 'price', 'emoji', 'category'];
                for (const field of requiredFields) {
                    if (!packageData[field]) {
                        return {
                            success: false,
                            error: `Missing required field: ${field}`
                        };
                    }
                }
                
                const newPackage = await packageService.createPackage(packageData);
                
                return {
                    success: true,
                    data: newPackage
                };
            } catch (error) {
                Logger.error('❌ Failed to create package:', error);
                return {
                    success: false,
                    error: 'Failed to create package'
                };
            }
        })

        // PUT /api/packages/:type - Update package
        .put('/:type', async ({ params, body }) => {
            try {
                const { type } = params;
                const updates = body as any;
                
                const updatedPackage = await packageService.updatePackage(type, updates);
                
                if (!updatedPackage) {
                    return {
                        success: false,
                        error: 'Package not found'
                    };
                }
                
                return {
                    success: true,
                    data: updatedPackage
                };
            } catch (error) {
                Logger.error('❌ Failed to update package:', error);
                return {
                    success: false,
                    error: 'Failed to update package'
                };
            }
        })

        // DELETE /api/packages/:type - Delete package
        .delete('/:type', async ({ params }) => {
            try {
                const { type } = params;
                const deleted = await packageService.deletePackage(type);
                
                if (!deleted) {
                    return {
                        success: false,
                        error: 'Package not found'
                    };
                }
                
                return {
                    success: true,
                    message: 'Package deleted successfully'
                };
            } catch (error) {
                Logger.error('❌ Failed to delete package:', error);
                return {
                    success: false,
                    error: 'Failed to delete package'
                };
            }
        })

        // POST /api/packages/:type/toggle - Toggle package active status
        .post('/:type/toggle', async ({ params }) => {
            try {
                const { type } = params;
                const updatedPackage = await packageService.togglePackageStatus(type);
                
                if (!updatedPackage) {
                    return {
                        success: false,
                        error: 'Package not found'
                    };
                }
                
                return {
                    success: true,
                    data: updatedPackage,
                    message: `Package ${updatedPackage.active ? 'activated' : 'deactivated'} successfully`
                };
            } catch (error) {
                Logger.error('❌ Failed to toggle package status:', error);
                return {
                    success: false,
                    error: 'Failed to toggle package status'
                };
            }
        })
    );
};