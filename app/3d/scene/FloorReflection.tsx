import { useEffect, useMemo } from "react";
import { PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

const RESOLUTION = 512;
const STRENGTH = 0.6; // 비스듬히 볼수록 강해지는 반사(프레넬)의 최대 세기

// 광택 있는 화이트워시 마루처럼 벽·그림이 흐릿하게 비치는 반사.
// 바닥 바로 위에 반투명 거울을 깔고, 거울에 찍힌 장면을 흐리게 해서 각도에 따라 섞음
const reflectionShader = {
    name: 'FloorReflection',
    uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        strength: { value: STRENGTH },
        texel: { value: new Vector2(1 / RESOLUTION, 1 / RESOLUTION) },
    },
    vertexShader: /* glsl */`
        uniform mat4 textureMatrix;
        varying vec4 vUv;
        varying vec3 vWorld;
        void main() {
            vUv = textureMatrix * vec4(position, 1.0);
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
        }
    `,
    fragmentShader: /* glsl */`
        uniform vec3 color;
        uniform sampler2D tDiffuse;
        uniform float strength;
        uniform vec2 texel;
        varying vec4 vUv;
        varying vec3 vWorld;
        void main() {
            vec2 uv = vUv.xy / vUv.w;
            vec3 sum = vec3(0.0);
            float total = 0.0;
            for (int x = -2; x <= 2; x++) {
                for (int y = -2; y <= 2; y++) {
                    float w = exp(-float(x * x + y * y) / 4.0);
                    sum += texture2D(tDiffuse, uv + vec2(float(x), float(y)) * texel * 2.0).rgb * w;
                    total += w;
                }
            }
            vec3 view = normalize(cameraPosition - vWorld);
            float fresnel = 0.04 + 0.96 * pow(1.0 - clamp(view.y, 0.0, 1.0), 5.0);
            gl_FragColor = vec4(sum / total * color, clamp(fresnel * strength, 0.0, 1.0));
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `,
};

export default function FloorReflection({ width, length, position }: { width: number; length: number; position: [number, number, number]; }) {
    const reflector = useMemo(() => {
        const mirror = new Reflector(new PlaneGeometry(width, length), {
            color: 0xffffff,
            textureWidth: RESOLUTION,
            textureHeight: RESOLUTION,
            clipBias: 0.003,
            multisample: 0,
            shader: reflectionShader,
        });
        const material = mirror.material as ShaderMaterial;
        material.transparent = true;
        material.depthWrite = false;
        mirror.rotation.x = -Math.PI / 2;
        mirror.renderOrder = 1;
        return mirror;
    }, [width, length]);

    useEffect(() => () => {
        reflector.dispose();
        reflector.geometry.dispose();
    }, [reflector]);

    return <primitive object={reflector} position={position} />;
}
