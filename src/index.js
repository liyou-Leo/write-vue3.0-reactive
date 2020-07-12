import {reactive, effect, computed, ref } from "./reactivity"

const state = reactive({
  name:ck,
  age:24,
  arr:[1,2,3,4]
})

// 相当于Watcher类‘
// effect的参数，被传入时应该立刻执行，然后数据每次更新时都要执行
effect(() => {
  console.log(state.name )
})

console.log(state.age )