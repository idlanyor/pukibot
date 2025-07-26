import { Elysia } from 'elysia';
import jwt from 'jsonwebtoken';
import { Logger } from '../../utils/logger';

export interface AuthPayload {
    userId: string;
    username: string;
    role: string;
    iat: number;
    exp: number;
}

export const createAuthRoutes = () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'pterodactyl-bot-secret-key';
    const DEFAULT_USERNAME = process.env.WEB_USERNAME || 'admin';
    const DEFAULT_PASSWORD = process.env.WEB_PASSWORD || 'admin123';
    
    return new Elysia({ prefix: '/auth' })
        .post('/login', async ({ body }) => {
            try {
                const { username, password } = body as { username: string; password: string };
                
                if (!username || !password) {
                    return {
                        success: false,
                        error: 'Username and password are required'
                    };
                }
                
                // Simple authentication - in production, use proper password hashing
                if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
                    const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
                        userId: '1',
                        username: username,
                        role: 'admin'
                    };
                    
                    const token = jwt.sign(payload, Buffer.from(process.env.JWT_SECRET || 'pterodactyl-bot-secret-key'), { expiresIn: '1h' });
                    
                    Logger.info(`🔐 User ${username} logged in successfully`);
                    
                    return {
                        success: true,
                        data: {
                            token,
                            user: payload,
                            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                        }
                    };
                } else {
                    Logger.warn(`🚫 Failed login attempt for username: ${username}`);
                    return {
                        success: false,
                        error: 'Invalid username or password'
                    };
                }
            } catch (error) {
                Logger.error('❌ Error during login:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            }
        })
        
        .post('/logout', async ({ headers }) => {
            try {
                // In a real implementation, you might want to blacklist the token
                Logger.info('🚪 User logged out');
                return {
                    success: true,
                    message: 'Logged out successfully'
                };
            } catch (error) {
                Logger.error('❌ Error during logout:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            }
        })
        
        .get('/verify', async ({ headers }) => {
            try {
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return {
                        success: false,
                        error: 'No token provided'
                    };
                }
                
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, Buffer.from(JWT_SECRET)) as AuthPayload;
                
                return {
                    success: true,
                    data: {
                        user: {
                            userId: decoded.userId,
                            username: decoded.username,
                            role: decoded.role
                        },
                        valid: true
                    }
                };
            } catch (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                    return {
                        success: false,
                        error: 'Invalid token'
                    };
                }
                
                Logger.error('❌ Error verifying token:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            }
        })
        
        .post('/refresh', async ({ headers }) => {
            try {
                const authHeader = headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return {
                        success: false,
                        error: 'No token provided'
                    };
                }
                
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, Buffer.from(JWT_SECRET)) as AuthPayload;
                
                // Generate new token
                const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role
                };
                
                const newToken = jwt.sign(payload, Buffer.from(JWT_SECRET || 'pterodactyl-bot-secret-key'), {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                });
                
                return {
                    success: true,
                    data: {
                        token: newToken,
                        user: payload,
                        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                    }
                };
            } catch (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                    return {
                        success: false,
                        error: 'Invalid token'
                    };
                }
                
                Logger.error('❌ Error refreshing token:', error);
                return {
                    success: false,
                    error: 'Internal server error'
                };
            }
        });
};

// Authentication middleware
export const authMiddleware = () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'pterodactyl-bot-secret-key';
    
    return new Elysia()
        .derive(({ headers }) => {
            const authHeader = headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('No token provided');
            }
            
            try {
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, Buffer.from(JWT_SECRET)) as AuthPayload;
                
                return {
                    user: {
                        userId: decoded.userId,
                        username: decoded.username,
                        role: decoded.role
                    }
                };
            } catch (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                    throw new Error('Invalid token');
                }
                throw error;
            }
        })
        .onError(({ error, set }) => {
            if (error.message === 'No token provided' || error.message === 'Invalid token') {
                set.status = 401;
                return {
                    success: false,
                    error: error.message
                };
            }
            
            set.status = 500;
            return {
                success: false,
                error: 'Internal server error'
            };
        });
};