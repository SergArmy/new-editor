import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { PermissionManager, AccessLevel } from '../../../../src/security/PermissionManager.js';
import { PermissionError } from '../../../../src/security/PermissionError.js';

const suite = new TestSuite('Security/PermissionManager');

suite.test('should identify owner access level', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId,
      editors: [],
      commenters: [],
      readers: []
    }
  };

  const level = manager.getAccessLevel(document);
  Assert.strictEqual(level, AccessLevel.OWNER);
});

suite.test('should identify editor access level', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId],
      commenters: [],
      readers: []
    }
  };

  const level = manager.getAccessLevel(document);
  Assert.strictEqual(level, AccessLevel.EDITOR);
});

suite.test('should identify commenter access level', () => {
  const currentUserId = 'user3';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 3' });
  
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [],
      commenters: [currentUserId],
      readers: []
    }
  };

  const level = manager.getAccessLevel(document);
  Assert.strictEqual(level, AccessLevel.COMMENTER);
});

suite.test('should identify reader access level', () => {
  const currentUserId = 'user4';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 4' });
  
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [],
      commenters: [],
      readers: [currentUserId]
    }
  };

  const level = manager.getAccessLevel(document);
  Assert.strictEqual(level, AccessLevel.READER);
});

suite.test('should return NONE for no access', () => {
  const currentUserId = 'user5';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 5' });
  
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [],
      commenters: [],
      readers: []
    }
  };

  const level = manager.getAccessLevel(document);
  Assert.strictEqual(level, AccessLevel.NONE);
});

suite.test('should allow owner to read document', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: { owner: currentUserId }
  };

  Assert.isTrue(manager.canReadDocument(document));
});

suite.test('should throw error when no read access', () => {
  const currentUserId = 'user5';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 5' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [],
      commenters: [],
      readers: []
    }
  };

  try {
    manager.canReadDocument(document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'NO_READ_ACCESS');
  }
});

suite.test('should allow owner and editor to edit document', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId]
    }
  };

  Assert.isTrue(manager.canEditDocument(document));
});

suite.test('should throw error when no edit access', () => {
  const currentUserId = 'user3';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 3' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [],
      commenters: [currentUserId]
    }
  };

  try {
    manager.canEditDocument(document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'NO_EDIT_ACCESS');
  }
});

suite.test('should allow only owner to delete document', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId,
      editors: ['user2']
    }
  };

  Assert.isTrue(manager.canDeleteDocument(document));
});

suite.test('should throw error when no delete access', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId]
    }
  };

  try {
    manager.canDeleteDocument(document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'NO_DELETE_ACCESS');
  }
});

suite.test('should allow commenter to comment', () => {
  const currentUserId = 'user3';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 3' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      commenters: [currentUserId]
    }
  };

  Assert.isTrue(manager.canCommentDocument(document));
});

suite.test('should throw error when no comment access', () => {
  const currentUserId = 'user4';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 4' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      readers: [currentUserId]
    }
  };

  try {
    manager.canCommentDocument(document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'NO_COMMENT_ACCESS');
  }
});

suite.test('should set user access level', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId,
      editors: [],
      commenters: [],
      readers: []
    }
  };

  manager.setUserAccess(document, 'user2', AccessLevel.EDITOR);
  Assert.isTrue(document.permissions.editors.includes('user2'));
});

suite.test('should remove user from all lists when setting NONE', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const manager = new PermissionManager({ getCurrentUser });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId,
      editors: ['user2'],
      commenters: ['user2'],
      readers: ['user2']
    }
  };

  manager.setUserAccess(document, 'user2', AccessLevel.NONE);
  Assert.isFalse(document.permissions.editors.includes('user2'));
  Assert.isFalse(document.permissions.commenters.includes('user2'));
  Assert.isFalse(document.permissions.readers.includes('user2'));
});

suite.test('should identify admin users', () => {
  const currentUserId = 'admin1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'Admin' });
  const isAdmin = () => true;
  const manager = new PermissionManager({ getCurrentUser, isAdmin });
  
  Assert.isTrue(manager.isAdmin());
});

suite.test('should give editor access to admin', () => {
  const currentUserId = 'admin1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'Admin' });
  const isAdmin = () => true;
  const manager = new PermissionManager({ getCurrentUser, isAdmin });
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: []
    }
  };

  // Администратор должен иметь уровень EDITOR
  const level = manager.getAccessLevel(document);
  Assert.strictEqual(level, AccessLevel.EDITOR);
});

suite.test('should check if user is current user', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const manager = new PermissionManager({ getCurrentUser });
  
  Assert.isTrue(manager.isCurrentUser(currentUserId));
  Assert.isFalse(manager.isCurrentUser('user2'));
});

export default suite;

