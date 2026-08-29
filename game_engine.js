const QUESTION_GENERATORS = {
    "middle1_3": [
        // ==========================================
        // [EASY / LV.1] 기본 개념 & 기초 연산
        // ==========================================
        {
            level: 1, type: "SHORT", unit: "3단원 문자와 식",
            template: "x = {a}일 때, {b}x + {c}의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 9), "c": range(1, 15) },
            eval_script: "(b * a) + c",
            explanation: "x에 {a}를 대입하면 {b} × {a} + {c} = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "3단원 일차방정식",
            template: "방정식 x + {a} = {b} 의 해 x를 구하시오.",
            param_rules: { "a": range(3, 25), "b": range(30, 60) },
            eval_script: "b - a",
            explanation: "x = {b} - {a} = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "3단원 일차방정식",
            template: "방정식 {a}x = {b}의 해 x를 구하시오.",
            param_rules: { "a": range(2, 9), "mult": range(2, 12) },
            dynamic_params: (p) => { p.b = p.a * p.mult; },
            eval_script: "b / a",
            explanation: "양변을 {a}로 나누면 x = {ans}입니다."
        },
        {
            level: 1, type: "SHORT", unit: "3단원 문자와 식",
            template: "음수 대입: a = -{a}일 때, -{b}a + {c}의 값을 구하시오.",
            param_rules: { "a": range(2, 6), "b": range(2, 5), "c": range(1, 10) },
            eval_script: "(-b * -a) + c",
            explanation: "(-{b}) × (-{a}) + {c} = {ans}입니다."
        },
        {
            level: 1, type: "CHOICE", unit: "3단원 문자와 식",
            template: "한 개에 {a}원하는 빵 {b}개와 {c}원하는 음료수 1개의 총 가격을 문자로 바르게 나타낸 것은?",
            param_rules: { "a": [500, 800, 1000, 1200, 1500], "b": ["x", "y"], "c": [700, 1000, 1500] },
            options: ["{a}{b} + {c}", "{a} + {b} + {c}", "{a}{b} - {c}", "{c}{b} + {a}"],
            eval_script: "'{a}{b} + {c}'",
            explanation: "빵 가격 {a}{b}원에 음료수 {c}원을 더하므로 {a}{b} + {c}원입니다."
        },
        {
            level: 1, type: "CHOICE", unit: "3단원 문자와 식",
            template: "다음 중 'x의 {a}배에서 {b}를 뺀 값'을 나타낸 식은?",
            param_rules: { "a": range(2, 6), "b": range(3, 9) },
            options: ["{a}x - {b}", "{a}x + {b}", "x - {a}{b}", "{b}x - {a}"],
            eval_script: "'{a}x - {b}'",
            explanation: "x의 {a}배는 {a}x이고, 여기서 {b}를 빼므로 {a}x - {b}입니다."
        },
        {
            level: 1, type: "OX", unit: "3단원 문자와 식",
            template: "곱셈 기호 생략: 'a × (-1) × b = -ab' 로 나타낼 수 있다.",
            param_rules: {},
            options: ["O", "X"],
            eval_script: "'O'",
            explanation: "-1과의 곱에서는 1을 생략하고 마이너스(-)만 붙이므로 -ab가 맞습니다."
        },

        // ==========================================
        // [NORMAL / LV.2] 복합 연산 & 괄호·동류항
        // ==========================================
        {
            level: 2, type: "SHORT", unit: "3단원 일차방정식",
            template: "일차방정식 {a}x - {b} = {c} 의 해 x를 구하시오.",
            param_rules: { "a": range(2, 6), "b": range(2, 15), "mult": range(3, 10) },
            dynamic_params: (p) => { p.c = (p.a * p.mult) - p.b; },
            eval_script: "(c + b) / a",
            explanation: "{a}x = {c} + {b} 이므로 {a}x = {c_plus_b}입니다. x = {ans}입니다."
        },
        {
            level: 2, type: "SHORT", unit: "3단원 문자와 식",
            template: "x = {a}, y = {b}일 때, {c}x - {d}y의 값을 구하시오.",
            param_rules: { "a": range(2, 5), "b": range(1, 4), "c": range(3, 7), "d": range(2, 5) },
            eval_script: "(c * a) - (d * b)",
            explanation: "{c} × {a} - {d} × {b} = {ans}입니다."
        },
        {
            level: 2, type: "SHORT", unit: "3단원 일차방정식",
            template: "이항 방정식: {a}x + {b} = {c}x + {d} 의 해 x를 구하시오.",
            param_rules: { "a": range(5, 9), "c": range(2, 4), "x_ans": range(2, 8) },
            dynamic_params: (p) => {
                p.b = range(1, 10)[0];
                p.d = (p.a * p.x_ans + p.b) - (p.c * p.x_ans);
            },
            eval_script: "x_ans",
            explanation: "x항은 좌변, 상수는 우변으로 이항하여 정리하면 x = {ans}입니다."
        },
        {
            level: 2, type: "CHOICE", unit: "3단원 일차방정식",
            template: "방정식 {a}(x + {b}) = {c}의 해 x는?",
            param_rules: { "a": range(2, 5), "b": range(1, 6), "mult": range(4, 10) },
            dynamic_params: (p) => { p.c = p.a * (p.mult + p.b); },
            options: ["{mult}", "{mult} + 1", "{mult} - 1", "{mult} + 2"],
            eval_script: "mult",
            explanation: "괄호를 풀면 {a}x + {a*b} = {c} 이므로 x = {ans}입니다."
        },
        {
            level: 2, type: "SHORT", unit: "3단원 문자와 식",
            template: "동류항 정리: {a}x + {b} + {c}x - {d} 를 간단히 하였을 때, x의 계수와 상수의 합을 구하시오.",
            param_rules: { "a": range(2, 6), "b": range(5, 12), "c": range(3, 7), "d": range(1, 4) },
            eval_script: "(a + c) + (b - d)",
            explanation: "동류항끼리 묶으면 ({a}+{c})x + ({b}-{d}) = {a+c}x + {b-d} 입니다. 계수와 상수의 합은 {ans}입니다."
        },
        {
            level: 2, type: "OX", unit: "3단원 문자와 식",
            template: "다항식 {a}x - {b} 에서 x의 계수는 {a}이고 상수항은 {b}이다.",
            param_rules: { "a": range(2, 6), "b": range(3, 8) },
            options: ["O", "X"],
            eval_script: "'X'",
            explanation: "상수항은 부호를 포함하여 -{b}입니다. 따라서 거짓(X)입니다."
        },

        // ==========================================
        // [HARD / LV.3] 분수·소수·활용(속력/거속시/농도)
        // ==========================================
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "어떤 수 x에 {a}를 더한 후 {b}배를 한 값은 {c}이다. x의 값을 구하시오.",
            param_rules: { "a": range(2, 9), "b": range(2, 4), "x_ans": range(3, 12) },
            dynamic_params: (p) => { p.c = p.b * (p.x_ans + p.a); },
            eval_script: "x_ans",
            explanation: "식: {b}(x + {a}) = {c} → x + {a} = {c/b} → x = {ans}입니다."
        },
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식",
            template: "분수 방정식: \\frac{{a}x + {b}}{{c}} = {d} 의 해 x를 구하시오.",
            param_rules: { "c": range(2, 4), "d": range(5, 12), "a": range(2, 5) },
            dynamic_params: (p) => {
                let target = p.c * p.d;
                p.x_ans = range(2, 8)[Math.floor(Math.random() * 6)];
                p.b = target - (p.a * p.x_ans);
            },
            eval_script: "x_ans",
            explanation: "양변에 {c}를 곱하면 {a}x + {b} = {c*d} 가 되므로 x = {ans}입니다."
        },
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식",
            template: "소수 계수: 0.{a}x + {b} = 0.{c}x + {d} 의 해 x를 구하시오.",
            param_rules: { "a": [3, 4, 5], "c": [1, 2], "x_ans": range(2, 9) },
            dynamic_params: (p) => {
                p.b = range(1, 5)[0];
                p.d = ((p.a * p.x_ans) + (p.b * 10) - (p.c * p.x_ans)) / 10;
            },
            eval_script: "x_ans",
            explanation: "양변에 10을 곱하여 {a}x + {b*10} = {c}x + {d*10} 로 정리하면 x = {ans}입니다."
        },
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "거속시 활용: 시속 {v}km로 x시간 동안 달린 거리가 {d}km일 때, 시간 x를 구하시오.",
            param_rules: { "v": [40, 50, 60, 80], "x_ans": range(2, 6) },
            dynamic_params: (p) => { p.d = p.v * p.x_ans; },
            eval_script: "x_ans",
            explanation: "거리 = 속력 × 시간이므로 {v}x = {d} 에서 x = {ans}시간입니다."
        },
        {
            level: 3, type: "SHORT", unit: "3단원 일차방정식의 활용",
            template: "나이 활용: 현재 아버지의 나이는 {f_age}세, 아들의 나이는 {s_age}세이다. 아버지의 나이가 아들 나이의 {k}배가 되는 것은 몇 년 후인가?",
            param_rules: { "s_age": range(10, 15), "k": [2, 3] },
            dynamic_params: (p) => {
                p.ans_years = range(3, 10)[Math.floor(Math.random() * 7)];
                // (s_age + x) * k = f_age + x  ==>  f_age = k*s_age + (k-1)*x
                p.f_age = (p.k * p.s_age) + ((p.k - 1) * p.ans_years);
            },
            eval_script: "ans_years",
            explanation: "x년 후 식: {f_age} + x = {k}({s_age} + x) 방정식의 해를 구하면 x = {ans}년 후입니다."
        },
        {
            level: 3, type: "CHOICE", unit: "3단원 일차방정식의 활용",
            template: "{a}%의 소금물 {b}g에 들어있는 순수한 소금의 양(g)은?",
            param_rules: { "a": [5, 8, 10, 12, 15], "b": [200, 300, 400, 500] },
            options: ["{ans_val}g", "{ans_val_w1}g", "{ans_val_w2}g", "{ans_val_w3}g"],
            dynamic_params: (p) => {
                p.ans_val = (p.a / 100) * p.b;
                p.ans_val_w1 = p.ans_val + 5;
                p.ans_val_w2 = p.a * 2;
                p.ans_val_w3 = p.ans_val - 2;
            },
            eval_script: "'{ans_val}g'",
            explanation: "소금의 양 = (농도/100) × 소금물의 양이므로 ({a}/100) × {b} = {ans_val}g 입니다."
        },
        {
            level: 3, type: "OX", unit: "3단원 문자와 식",
            template: "명제: '가로의 길이가 x, 세로의 길이가 {a}인 직사각형의 둘레는 {b}x + {c}이다.' 이 설명은 참(O)일까요, 거짓(X)일까요?",
            param_rules: { "a": range(3, 8), "is_correct": [true, false] },
            dynamic_params: (p) => {
                p.b = 2;
                p.c = p.is_correct ? p.a * 2 : p.a;
            },
            options: ["O", "X"],
            eval_script: "is_correct ? 'O' : 'X'",
            explanation: "직사각형 둘레 = 2(가로 + 세로) = 2(x + {a}) = 2x + {a*2} 입니다."
        }
    ]
};
