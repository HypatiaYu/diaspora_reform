class BasicWarrior extends WarriorUnit {
    static instances = [];
    static MOVE_SPEED = 0.07;
    static ATTACK_DAMAGE = 4;
    static ATTACK_COOLDOWN = 800;
    static BODY_GEOMETRY = new THREE.BoxGeometry(0.7, 1.0, 0.7);
    static BODY_COLOR = 0xff0000;
    static BODY_EMISSIVE = 0x880000;
    static HEALTH = 10;
    static MAX_HEALTH = 10;

    constructor(scene, position, homeBase) {
        super(scene, position, homeBase);
        BasicWarrior.instances.push(this);
    }

    remove() {
        super.remove();
        const idx = BasicWarrior.instances.indexOf(this);
        if (idx > -1) BasicWarrior.instances.splice(idx, 1);
    }
}

class FastWarrior extends WarriorUnit {
    static instances = [];
    static MOVE_SPEED = 0.12;
    static ATTACK_DAMAGE = 2;
    static ATTACK_COOLDOWN = 500;
    static BODY_GEOMETRY = new THREE.ConeGeometry(0.3, 1.2, 4);
    static BODY_COLOR = 0x00ffff;
    static BODY_EMISSIVE = 0x008888;
    static HEALTH = 6;
    static MAX_HEALTH = 6;

    constructor(scene, position, homeBase) {
        super(scene, position, homeBase);
        FastWarrior.instances.push(this);
    }

    remove() {
        super.remove();
        const idx = FastWarrior.instances.indexOf(this);
        if (idx > -1) FastWarrior.instances.splice(idx, 1);
    }
}

class TankWarrior extends WarriorUnit {
    static instances = [];
    static MOVE_SPEED = 0.04;
    static ATTACK_DAMAGE = 8;
    static ATTACK_COOLDOWN = 1500;
    static BODY_GEOMETRY = new THREE.BoxGeometry(1.2, 1.5, 1.2);
    static BODY_COLOR = 0x8800ff;
    static BODY_EMISSIVE = 0x4400aa;
    static HEALTH = 20;
    static MAX_HEALTH = 20;

    constructor(scene, position, homeBase) {
        super(scene, position, homeBase);
        TankWarrior.instances.push(this);
    }

    remove() {
        super.remove();
        const idx = TankWarrior.instances.indexOf(this);
        if (idx > -1) TankWarrior.instances.splice(idx, 1);
    }
}
