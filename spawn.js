class EntityTemplate {
    constructor(scene) {
        this.scene = scene;
        this.id = Date.now() + Math.random();
    }

    getPosition() {
        return this.mesh ? this.mesh.position.clone() : null;
    }

    getId() {
        return this.id;
    }
}

class ResourceNode extends EntityTemplate {
    static instances = [];
    static DOT_GEOMETRY = new THREE.SphereGeometry(0.12, 8, 8);
    static UNITS_PER_DOT = 20;

    constructor(scene, position, amount) {
        super(scene);
        this.amount = amount;
        this.position = position;
        this.dots = [];
        
        this.createDots();
        
        this.mesh = new THREE.Group();
        this.mesh.position.set(position.x, 0, position.z);
        this.mesh.userData.resource = this;
        
        const hitGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitCyl = new THREE.Mesh(hitGeom, hitMat);
        hitCyl.position.y = 0.5;
        this.mesh.add(hitCyl);
        
        this.dots.forEach(dot => this.mesh.add(dot));
        
        this.scene.add(this.mesh);
        ResourceNode.instances.push(this);
    }

    createDots() {
        const numDots = Math.ceil(this.amount / ResourceNode.UNITS_PER_DOT);
        const hue = Math.max(0.1, this.amount / 200);
        
        for (let i = 0; i < numDots; i++) {
            const material = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(hue, 0.9, 0.5),
                emissive: new THREE.Color().setHSL(hue, 0.9, 0.3),
                metalness: 0.3,
                roughness: 0.4
            });
            
            const dot = new THREE.Mesh(ResourceNode.DOT_GEOMETRY, material);
            const spread = 0.8;
            dot.position.set(
                (Math.random() - 0.5) * spread,
                Math.random() * 0.8 + 0.2,
                (Math.random() - 0.5) * spread
            );
            dot.castShadow = true;
            
            this.dots.push(dot);
        }
    }

    updateDots() {
        const targetDots = Math.ceil(this.amount / ResourceNode.UNITS_PER_DOT);
        
        while (this.dots.length > targetDots) {
            const dot = this.dots.pop();
            this.mesh.remove(dot);
            dot.geometry.dispose();
            dot.material.dispose();
        }
        
        this.dots.forEach((dot, i) => {
            dot.position.y = 0.2 + Math.sin(Date.now() * 0.003 + i) * 0.1;
            dot.rotation.y += 0.02;
        });
    }

    collect(amount) {
        this.amount = Math.max(0, this.amount - amount);
        this.updateDots();
        
        if (this.amount <= 0) {
            this.remove();
        }
    }

    remove() {
        this.dots.forEach(dot => {
            dot.geometry.dispose();
            dot.material.dispose();
        });
        this.scene.remove(this.mesh);
        const idx = ResourceNode.instances.indexOf(this);
        if (idx > -1) ResourceNode.instances.splice(idx, 1);
    }
}

class BaseEntity extends EntityTemplate {
    static instances = [];

    constructor(scene, position) {
        super(scene);
        this.name = `Base #${BaseEntity.instances.length + 1}`;
        
        const geometry = new THREE.BoxGeometry(2, 1.5, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,
            emissive: 0x1B5E20,
            metalness: 0.3,
            roughness: 0.7
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, 0.75, position.z);
        this.mesh.castShadow = true;
        this.mesh.userData.isBase = true;
        this.mesh.userData.base = this;
        
        this.scene.add(this.mesh);
        BaseEntity.instances.push(this);

        this.spawnDrones(4);
        spawnResourcesAtBasePosition(scene, position);
    }

    spawnDrones(count) {
        for (let i = 0; i < count; i++) {
            let validPos = false;
            let dronePos;
            let attempts = 0;
            
            while (!validPos && attempts < 20) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                const radius = 2 + Math.random() * 1.5;
                dronePos = {
                    x: this.mesh.position.x + Math.cos(angle) * radius,
                    z: this.mesh.position.z + Math.sin(angle) * radius
                };
                
                validPos = true;
                for (const drone of DroneEntity.instances) {
                    if (drone.mesh.position.distanceTo(new THREE.Vector3(dronePos.x, 0, dronePos.z)) < 1.5) {
                        validPos = false;
                        break;
                    }
                }
                attempts++;
            }
            
            if (validPos) {
                new DroneEntity(this.scene, dronePos, this);
            }
        }
    }
}

class DroneEntity extends EntityTemplate {
    static instances = [];
    static COLLECT_AMOUNT = 4;
    static MOVE_SPEED = 0.08;

    constructor(scene, position, homeBase) {
        super(scene);
        this.homeBase = homeBase;
        this.targetResource = null;
        this.state = 'idle';
        this.carrying = 0;
        this.health = 6;
        this.maxHealth = 6;
        
        const group = new THREE.Group();
        
        const geometry = new THREE.ConeGeometry(0.4, 1, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff8800,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            metalness: 0.7,
            roughness: 0.1
        });
        
        const cone = new THREE.Mesh(geometry, material);
        cone.rotation.x = Math.PI;
        cone.position.y = 0.5;
        group.add(cone);
        
        const glowGeom = new THREE.SphereGeometry(0.25, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.y = 0.5;
        group.add(glow);
        
        group.position.set(position.x, 0, position.z);
        group.castShadow = true;
        group.userData.isDrone = true;
        group.userData.drone = this;
        
        const hitGeom = new THREE.SphereGeometry(1, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitSphere = new THREE.Mesh(hitGeom, hitMat);
        hitSphere.position.y = 0.5;
        group.add(hitSphere);
        
        this.mesh = group;
        
        this.scene.add(this.mesh);
        DroneEntity.instances.push(this);
        
        this.animate();
    }

    animate() {
        const anim = () => {
            if (this.mesh) {
                this.mesh.rotation.y += 0.08;
            }
            requestAnimationFrame(anim);
        };
        anim();
    }

    setSelected(selected) {
        if (!this.mesh) return;
        const cone = this.mesh.children[0];
        const glow = this.mesh.children[2];
        if (selected) {
            cone.material.emissive.setHex(0x00ff00);
            cone.material.emissiveIntensity = 1.0;
            glow.material.color.setHex(0x00ff00);
            glow.material.opacity = 1.0;
        } else {
            cone.material.emissive.setHex(0xff4400);
            cone.material.emissiveIntensity = 0.8;
            glow.material.color.setHex(0xffff00);
            glow.material.opacity = 0.6;
        }
    }

    assignToResource(resource) {
        if (!resource || resource.amount <= 0) return;
        this.targetResource = resource;
        this.state = 'moving_to_resource';
    }

    assignToNearestResource() {
        if (ResourceNode.instances.length === 0) return;
        
        let nearest = null;
        let minDist = Infinity;
        
        ResourceNode.instances.forEach(res => {
            const dist = this.mesh.position.distanceTo(res.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = res;
            }
        });
        
        if (nearest) {
            this.targetResource = nearest;
            this.state = 'moving_to_resource';
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        if (this.health <= 0) {
            this.remove();
            return true;
        }
        return false;
    }

    update() {
        if (this.state === 'idle' || !this.homeBase) return;

        const basePos = this.homeBase.mesh.position;
        
        if (this.state === 'moving_to_resource' && this.targetResource) {
            if (this.targetResource.amount <= 0) {
                this.targetResource = null;
                this.state = 'idle';
                return;
            }
            
            const targetPos = this.targetResource.mesh.position;
            const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
            const dist = dir.length();
            
            if (dist < 0.5) {
                this.carrying = Math.min(DroneEntity.COLLECT_AMOUNT, this.targetResource.amount);
                this.targetResource.collect(this.carrying);
                this.state = 'returning';
            } else {
                dir.normalize().multiplyScalar(DroneEntity.MOVE_SPEED);
                this.mesh.position.add(dir);
            }
        }
        else if (this.state === 'returning') {
            const dir = new THREE.Vector3().subVectors(basePos, this.mesh.position);
            const dist = dir.length();
            
            if (dist < 1) {
                if (typeof totalResourcesCollected !== 'undefined') {
                    totalResourcesCollected += this.carrying;
                }
                this.carrying = 0;
                
                if (this.targetResource && this.targetResource.amount > 0) {
                    this.state = 'moving_to_resource';
                } else {
                    this.targetResource = null;
                    this.state = 'idle';
                }
            } else {
                dir.normalize().multiplyScalar(DroneEntity.MOVE_SPEED);
                this.mesh.position.add(dir);
            }
        }
    }

    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        const idx = DroneEntity.instances.indexOf(this);
        if (idx > -1) DroneEntity.instances.splice(idx, 1);
    }
}

class EnemyUnit extends EntityTemplate {
    static instances = [];
    static MOVE_SPEED = 0.06;
    static ATTACK_DAMAGE = 2;
    static ATTACK_COOLDOWN = 1000;
    static BODY_GEOMETRY = new THREE.DodecahedronGeometry(0.6);
    static BODY_COLOR = 0xff2222;
    static BODY_EMISSIVE = 0x990000;

    constructor(scene, position) {
        super(scene);
        this.target = null;
        this.lastAttackTime = 0;
        this.state = 'hunting';
        
        const group = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.constructor.BODY_COLOR,
            emissive: this.constructor.BODY_EMISSIVE,
            emissiveIntensity: 0.5,
            metalness: 0.6,
            roughness: 0.3
        });
        
        const body = new THREE.Mesh(this.constructor.BODY_GEOMETRY, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        
        const eyeGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        
        const eye1 = new THREE.Mesh(eyeGeom, eyeMat);
        eye1.position.set(-0.2, 0.8, 0.4);
        group.add(eye1);
        
        const eye2 = new THREE.Mesh(eyeGeom, eyeMat);
        eye2.position.set(0.2, 0.8, 0.4);
        group.add(eye2);
        
        group.position.set(position.x, 0, position.z);
        group.userData.isEnemy = true;
        group.userData.enemy = this;
        
        const hitGeom = new THREE.SphereGeometry(1.5, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitSphere = new THREE.Mesh(hitGeom, hitMat);
        hitSphere.position.y = 0.6;
        group.add(hitSphere);
        
        this.mesh = group;
        this.body = body;
        
        this.scene.add(this.mesh);
        EnemyUnit.instances.push(this);
        
        this.animate();
    }

    animate() {
        const anim = () => {
            if (this.mesh) {
                this.mesh.rotation.y += 0.05;
                this.body.rotation.x = Math.sin(Date.now() * 0.005) * 0.2;
            }
            requestAnimationFrame(anim);
        };
        anim();
    }

    findNearestDrone() {
        if (DroneEntity.instances.length === 0) return null;
        
        let nearest = null;
        let minDist = Infinity;
        
        DroneEntity.instances.forEach(drone => {
            const dist = this.mesh.position.distanceTo(drone.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = drone;
            }
        });
        
        return nearest;
    }

    update() {
        if (DroneEntity.instances.length === 0) {
            this.state = 'idle';
            return;
        }

        this.target = this.findNearestDrone();
        
        if (!this.target) return;
        
        const targetPos = this.target.mesh.position;
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
        const dist = dir.length();
        
        if (dist < 1.2) {
            const now = Date.now();
            if (now - this.lastAttackTime >= this.constructor.ATTACK_COOLDOWN) {
                this.lastAttackTime = now;
                
                const dead = this.target.takeDamage(this.constructor.ATTACK_DAMAGE);
                
                this.body.scale.set(1.3, 1.3, 1.3);
                setTimeout(() => {
                    if (this.body) this.body.scale.set(1, 1, 1);
                }, 100);
                
                if (typeof updateInfo === 'function') updateInfo();
            }
        } else {
            dir.normalize().multiplyScalar(this.constructor.MOVE_SPEED);
            this.mesh.position.add(dir);
        }
    }

    takeDamage(amount) {
        return false;
    }

    remove() {
        this.scene.remove(this.mesh);
        const idx = EnemyUnit.instances.indexOf(this);
        if (idx > -1) EnemyUnit.instances.splice(idx, 1);
    }
}

class WarriorEntity extends EntityTemplate {
    static instances = [];

    constructor(scene, position, homeBase) {
        super(scene);
        this.homeBase = homeBase;
        
        const group = new THREE.Group();
        
        const bodyGeom = new THREE.BoxGeometry(0.7, 1.0, 0.7);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0x880000,
            emissiveIntensity: 0.5,
            metalness: 0.6,
            roughness: 0.3
        });
        
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.5;
        group.add(body);
        
        const hornGeom = new THREE.ConeGeometry(0.12, 0.5, 4);
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        
        const horn1 = new THREE.Mesh(hornGeom, hornMat);
        horn1.position.set(-0.2, 1.1, 0.2);
        horn1.rotation.x = Math.PI / 4;
        group.add(horn1);
        
        const horn2 = new THREE.Mesh(hornGeom, hornMat);
        horn2.position.set(0.2, 1.1, 0.2);
        horn2.rotation.x = Math.PI / 4;
        group.add(horn2);
        
        const eyeGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        
        const eye1 = new THREE.Mesh(eyeGeom, eyeMat);
        eye1.position.set(-0.15, 0.7, 0.35);
        group.add(eye1);
        
        const eye2 = new THREE.Mesh(eyeGeom, eyeMat);
        eye2.position.set(0.15, 0.7, 0.35);
        group.add(eye2);
        
        group.position.set(position.x, 0, position.z);
        group.castShadow = true;
        group.userData.isWarrior = true;
        group.userData.warrior = this;
        
        const hitGeom = new THREE.SphereGeometry(1, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitSphere = new THREE.Mesh(hitGeom, hitMat);
        hitSphere.position.y = 0.5;
        group.add(hitSphere);
        
        this.mesh = group;
        this.scene.add(this.mesh);
        WarriorEntity.instances.push(this);
        
        this.animate();
    }

    animate() {
        const anim = () => {
            if (this.mesh) {
                this.mesh.rotation.y += 0.03;
            }
            requestAnimationFrame(anim);
        };
        anim();
    }
}

function updateDrones() {
    DroneEntity.instances.forEach(drone => drone.update());
    ResourceNode.instances.forEach(res => res.updateDots());
}

function updateEnemies() {
    EnemyUnit.instances.forEach(enemy => enemy.update());
}

function spawnResourcesAtBasePosition(scene, position) {
    const numNodes = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numNodes; i++) {
        const angle = (Math.PI * 2 * i) / Math.max(numNodes, 1) + Math.random() * 0.5;
        const radius = 4 + Math.random() * 1;
        const x = position.x + Math.cos(angle) * radius;
        const z = position.z + Math.sin(angle) * radius;
        
        const amount = Math.floor(Math.random() * 60) + 40;
        new ResourceNode(scene, {x, z}, amount);
    }
}

const DRONE_COST = 4;
const WARRIOR_COST = 10;

function spawnMap(scene) {
    spawnRandomResources();
    return scene;
}

function spawnBase(scene, position) {
    return new BaseEntity(scene, position);
}

function spawnDrone(scene, position, homeBase) {
    return new DroneEntity(scene, position, homeBase);
}

function spawnWarrior(scene, position, homeBase) {
    return new WarriorEntity(scene, position, homeBase);
}

let EnemyType = EnemyUnit;

function spawnEnemy(scene, position, enemyType = null) {
    const Type = enemyType || EnemyType;
    return new Type(scene, position);
}

function setEnemyType(type) {
    EnemyType = type;
}

function spawnAll(scene, position) {
    spawnRandomResources();
    const base = spawnBase(scene, position);
    return base;
}
