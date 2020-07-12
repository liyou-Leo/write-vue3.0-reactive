
import { mutableHandlers } from './baseHandlers'; //mutableHandlers就是Proxy中处理代理的相关逻辑
import { isObject } from '../shared/util'; // 工具方法

// target就是传进来要做响应式的对象
export function reactive(target) {

    // 根据不同参数创建不同响应式对象
    return createReactiveObject(
        target,
        mutableHandlers
    )

}

function createReactiveObject(target, baseHandler) {
    // 不是对象就不做处理
    if (!isObject(target)) {
        return target;
    }

    // new Proxy进行处理
    const observed = new Proxy(target, baseHandler);

    // 将Proxy对象返回
    return observed
}

