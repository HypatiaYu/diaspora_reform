class BasicEnemy extends EnemyUnit {
    static instances = [];
    static MOVE_SPEED = 0.06;
    static ATTACK_DAMAGE = 2;
    static ATTACK_COOLDOWN = 1000;
    static BODY_GEOMETRY = new THREE.DodecahedronGeometry(0.6);
    static BODY_COLOR = 0xff2222;
    static BODY_EMISSIVE = 0x990000;

    constructor(scene, position) {
        super(scene, position);
        BasicEnemy.instances.push(this);
    }

    remove() {
        super.remove();
        const idx = BasicEnemy.instances.indexOf(this);
        if (idx > -1) BasicEnemy.instances.splice(idx, 1);
    }
}

class FastEnemy extends EnemyUnit {
    static instances = [];
    static MOVE_SPEED = 0.12;
    static ATTACK_DAMAGE = 1;
    static ATTACK_COOLDOWN = 500;
    static BODY_GEOMETRY = new THREE.OctahedronGeometry(0.5);
    static BODY_COLOR = 0xff6600;
    static BODY_EMISSIVE = 0xff3300;

    constructor(scene, position) {
        super(scene, position);
        FastEnemy.instances.push(this);
    }

    remove() {
        super.remove();
        const idx = FastEnemy.instances.indexOf(this);
        if (idx > -1) FastEnemy.instances.splice(idx, 1);
    }
}

class TankEnemy extends EnemyUnit {
    static instances = [];
    static MOVE_SPEED = 0.03;
    static ATTACK_DAMAGE = 4;
    static ATTACK_COOLDOWN = 2000;
    static BODY_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
    static BODY_COLOR = 0x8800ff;
    static BODY_EMISSIVE = 0x4400aa;

    constructor(scene, position) {
        super(scene, position);
        TankEnemy.instances.push(this);
    }

    remove() {
        super.remove();
        const idx = TankEnemy.instances.indexOf(this);
        if (idx > -1) TankEnemy.instances.splice(idx, 1);
    }
}
