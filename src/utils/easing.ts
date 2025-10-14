// src/utils/Easing.ts

/**
 * 汎用的なイージング関数を提供するユーティリティクラス。
 * すべての関数は 0から1 の入力 (x) を受け取り、0から1 の出力 (アニメーションの進行度) を返します。
 */
export class Easing {
    // 静的メソッドとして元のロジックをそのまま保持

    static easeInSine(x: number): number {
        return 1 - Math.cos((x * Math.PI) / 2);
    }

    static easeOutSine(x: number): number {
        return Math.sin((x * Math.PI) / 2);
    }

    static easeInOutSine(x: number): number {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    static easeInQuad(x: number): number {
        return x * x;
    }

    static easeOutQuad(x: number): number {
        return 1 - (1 - x) * (1 - x);
    }

    static easeInOutQuad(x: number): number {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }

    static easeInCubic(x: number): number {
        return x * x * x;
    }

    static easeOutCubic(x: number): number {
        return 1 - Math.pow(1 - x, 3);
    }

    static easeInOutCubic(x: number): number {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    static easeInQuart(x: number): number {
        return x * x * x * x;
    }

    static easeOutQuart(x: number): number {
        return 1 - Math.pow(1 - x, 4);
    }

    static easeInOutQuart(x: number): number {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }

    static easeInQuint(x: number): number {
        return x * x * x * x * x;
    }

    static easeOutQuint(x: number): number {
        return 1 - Math.pow(1 - x, 5);
    }

    static easeInOutQuint(x: number): number {
        return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
    }

    static easeInExpo(x: number): number {
        return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

    static easeOutExpo(x: number): number {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    static easeInOutExpo(x: number): number {
        return x === 0 ?
            0 :
            x === 1 ?
                1 :
                x < 0.5 ?
                    Math.pow(2, 20 * x - 10) / 2 :
                    (2 - Math.pow(2, -20 * x + 10)) / 2;
    }

    static easeInCirc(x: number): number {
        return 1 - Math.sqrt(1 - Math.pow(x, 2));
    }

    static easeOutCirc(x: number): number {
        return Math.sqrt(1 - Math.pow(x - 1, 2));
    }

    static easeInOutCirc(x: number): number {
        return x < 0.5 ?
            (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 :
            (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    }

    static easeOutBack(x: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    static easeInOutBack(x: number): number {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return x < 0.5 ?
            (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 :
            (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
    }
}