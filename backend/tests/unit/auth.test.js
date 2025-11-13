const authService = require('../../src/services/authService');
const User = require('../../src/models/User');

// Mock User model
jest.mock('../../src/models/User');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'parent',
        profile: {
          name: 'Test User'
        }
      };

      const mockUser = {
        _id: 'user123',
        email: userData.email,
        role: userData.role,
        profile: userData.profile,
        isEmailVerified: false,
        getSignedJwtToken: jest.fn().mockReturnValue('mock-token'),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockUser);

      const result = await authService.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'parent',
        profile: { name: 'Test User' }
      };

      User.findOne.mockResolvedValue({ email: userData.email });

      await expect(authService.register(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        _id: 'user123',
        email,
        role: 'parent',
        profile: { name: 'Test User' },
        settings: { notifications: { email: true, push: true } },
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(true),
        getSignedJwtToken: jest.fn().mockReturnValue('mock-token'),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.login(email, password);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(mockUser.matchPassword).toHaveBeenCalledWith(password);
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
    });

    it('should throw error with invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is inactive', async () => {
      const mockUser = {
        isActive: false,
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });
  });
});