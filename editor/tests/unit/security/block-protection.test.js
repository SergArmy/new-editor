import { TestSuite } from '../../../test-framework/TestSuite.js';
import { Assert } from '../../../test-framework/Assert.js';
import { BlockProtection, ProtectionLevel } from '../../../../src/security/BlockProtection.js';
import { PermissionManager, AccessLevel } from '../../../../src/security/PermissionManager.js';
import { PermissionError } from '../../../../src/security/PermissionError.js';

const suite = new TestSuite('Security/BlockProtection');

suite.test('should allow editing unprotected block with document edit access', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId]
    }
  };

  const block = {
    id: 'block1',
    protected: false,
    type: 'text'
  };

  Assert.isTrue(blockProtection.canEditBlock(block, document));
});

suite.test('should prevent editing protected block without owner rights', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId]
    }
  };

  const block = {
    id: 'block1',
    protected: true,
    protectionLevel: ProtectionLevel.READ_ONLY,
    type: 'text'
  };

  try {
    blockProtection.canEditBlock(block, document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'BLOCK_PROTECTED');
  }
});

suite.test('should allow owner to edit protected block', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId,
      editors: []
    }
  };

  const block = {
    id: 'block1',
    protected: true,
    protectionLevel: ProtectionLevel.READ_ONLY,
    type: 'text'
  };

  Assert.isTrue(blockProtection.canEditBlock(block, document));
});

suite.test('should allow admin to edit admin-only protected block', () => {
  const currentUserId = 'admin1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'Admin' });
  const isAdmin = () => true;
  const permissionManager = new PermissionManager({ getCurrentUser, isAdmin });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: []
    }
  };

  const block = {
    id: 'block1',
    protected: true,
    protectionLevel: ProtectionLevel.ADMIN_ONLY,
    type: 'text'
  };

  Assert.isTrue(blockProtection.canEditBlock(block, document));
});

suite.test('should prevent non-admin from editing admin-only block', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const isAdmin = () => false;
  const permissionManager = new PermissionManager({ getCurrentUser, isAdmin });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId,
      editors: []
    }
  };

  const block = {
    id: 'block1',
    protected: true,
    protectionLevel: ProtectionLevel.ADMIN_ONLY,
    type: 'text'
  };

  try {
    blockProtection.canEditBlock(block, document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'BLOCK_ADMIN_ONLY');
  }
});

suite.test('should check if block is protected', () => {
  const permissionManager = new PermissionManager();
  const blockProtection = new BlockProtection(permissionManager);
  
  const protectedBlock = { id: 'block1', protected: true };
  const unprotectedBlock = { id: 'block2', protected: false };
  
  Assert.isTrue(blockProtection.isProtected(protectedBlock));
  Assert.isFalse(blockProtection.isProtected(unprotectedBlock));
});

suite.test('should get protection level', () => {
  const permissionManager = new PermissionManager();
  const blockProtection = new BlockProtection(permissionManager);
  
  const block1 = { id: 'block1', protected: false };
  const block2 = { id: 'block2', protected: true, protectionLevel: ProtectionLevel.READ_ONLY };
  const block3 = { id: 'block3', protected: true, protectionLevel: ProtectionLevel.ADMIN_ONLY };
  
  Assert.strictEqual(blockProtection.getProtectionLevel(block1), ProtectionLevel.NONE);
  Assert.strictEqual(blockProtection.getProtectionLevel(block2), ProtectionLevel.READ_ONLY);
  Assert.strictEqual(blockProtection.getProtectionLevel(block3), ProtectionLevel.ADMIN_ONLY);
});

suite.test('should set protection on block', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId
    }
  };

  const block = {
    id: 'block1',
    protected: false,
    type: 'text'
  };

  blockProtection.setProtection(block, document, ProtectionLevel.READ_ONLY);
  Assert.isTrue(block.protected);
  Assert.strictEqual(block.protectionLevel, ProtectionLevel.READ_ONLY);
});

suite.test('should prevent non-owner from setting protection', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId]
    }
  };

  const block = {
    id: 'block1',
    protected: false,
    type: 'text'
  };

  try {
    blockProtection.setProtection(block, document);
    Assert.isTrue(false, 'Should throw PermissionError');
  } catch (e) {
    Assert.isTrue(e instanceof PermissionError);
    Assert.strictEqual(e.code, 'NOT_OWNER');
  }
});

suite.test('should remove protection from block', () => {
  const currentUserId = 'user1';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 1' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: currentUserId
    }
  };

  const block = {
    id: 'block1',
    protected: true,
    protectionLevel: ProtectionLevel.READ_ONLY,
    type: 'text'
  };

  blockProtection.removeProtection(block, document);
  Assert.isFalse(block.protected);
});

suite.test('should allow duplicate of unprotected block', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      readers: [currentUserId]
    }
  };

  const block = {
    id: 'block1',
    protected: false,
    type: 'text'
  };

  Assert.isTrue(blockProtection.canDuplicateBlock(block, document));
});

suite.test('should create safe copy for readable blocks', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      editors: [currentUserId]
    }
  };

  const block = {
    id: 'block1',
    protected: false,
    type: 'text',
    data: { text: 'Content' }
  };

  const copy = blockProtection.createSafeCopy(block, document);
  Assert.isNotNull(copy);
  Assert.strictEqual(copy.id, block.id);
});

suite.test('should create read-only copy for protected blocks', () => {
  const currentUserId = 'user2';
  const getCurrentUser = () => ({ id: currentUserId, name: 'User 2' });
  const permissionManager = new PermissionManager({ getCurrentUser });
  const blockProtection = new BlockProtection(permissionManager);
  
  const document = {
    id: 'doc1',
    permissions: {
      owner: 'user1',
      readers: [currentUserId]
    }
  };

  const block = {
    id: 'block1',
    protected: true,
    type: 'text',
    data: { text: 'Content' }
  };

  const copy = blockProtection.createSafeCopy(block, document);
  Assert.isNotNull(copy);
  Assert.isTrue(copy.readOnly);
});

export default suite;

