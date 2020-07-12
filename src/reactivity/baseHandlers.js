// handler代理的处理方法
import { isObject, hasOwn, hasChanged } from "../shared/util";
import {TrackOpTypes, TriggerOpTypes} from "./operations"
import {tract, trigger } from "./effect"

// 引入reactive时为了对数据递归进行响应式处理
import { reactive } from "./reactive";

const get = createGetter();
const set = createSetter();

function createGetter() {

    return function get(target, key, receiver) {
        // 对获取的值进行映射
        const res = Reflect.get(target, key, receiver);

        console.log('属性获取',key)

        // 依赖收集
        tract(target,TrackOpTypes.GET,key)

         // 如果获取的值是对象类型，则返回当前对象的代理对象
        //  vue2.0是直接一上来就进行递归操作进行响应式处理
        //  而3.0是只有这个值被取到时，发现这个值是对象，才会进一步进行响应式处理
        // 比如{name:14, arr:{},}，一上来会对name和arr这两个属性做响应式，只有state.arr被使用时，才会对arr的对象进行响应式处理
        if (isObject(res)) {
            return reactive(res);
        }


        return res;

    }
}

function createSetter() {

    return function set(target, key, value, receiver) {
        // 先从get上获得旧值
        const oldValue = target[key];

        // 查看target上有没有这个属性
        const hadKey = hasOwn(target, key);

        // 设置新的值，返回设置成功与否的布尔值
        const result = Reflect.set(target, key, value, receiver);

        // 没有说明是新增的属性
        if (!hadKey) {

            console.log('属性新增',key,value)
            // 派发更新
            trigger(target, TriggerOpTypes.ADD, key)

        // 如果有，并且hasChanged为true，表示新旧值不一样，说明是更新修改这个值
        // 数组的push这种方法，都是进行了两个操作
        // 是先将arr[arr.length] = newValue。然后将arr.length设置为新的长度。
        // 第一次操作arr[arr.length]时，因为数组没有这个属性，所以是新增属性。
        // 而将arr.length设置为新的长度时，因为arr.length是数组本身就有的属性，因此使修改属性
        } else if (hasChanged(value, oldValue)) {

            console.log('属性值被修改',key,value)
            // 派发更新
            trigger(target, TriggerOpTypes.SET, key)

        }
        // 返回设置成功与否的布尔值
        return result;
    }
}
export const mutableHandlers = {

    get, // 当获取属性时调用此方法
    set // 当修改属性时调用此方法

}