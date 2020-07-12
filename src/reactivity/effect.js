// 创建effect时可以传递参数，computed也是基于effect来实现的，只是增加了一些参数条件而已
export function effect(fn, options = {}) {

  // 创建响应式的effect:数据变化，effect自动执行
  const effect = createReactiveEffect(fn, options);

  // computed effect一上来不执行
  if (!options.lazy) {
      effect(); // 其他的effect应该立即被执行
  }

  return effect;
}
// effect的id
let uid = 0;

const effectStack = []; // 存放effect的队列,相当于watcher队列

let activeEffect ; // 当前正在执行的effect，相当于Dep.target

function createReactiveEffect(fn, options) {

  const effect = function reactiveEffect() {

      // 队列中没有才加入，防止同一个effect被多次加入
      if (!effectStack.includes(effect)) {
          try {
              effectStack.push(effect); // 将当前effect放到栈中
              activeEffect = effect; // 标记当前运行的effect
              return fn(); // 执行effect，执行的是用户定义的方法
          } finally {
              effectStack.pop(); // 执行完毕后出栈
              activeEffect = effectStack[effectStack.length - 1]; //当前正在执行的effect恢复为原来的栈顶
          }
      }
  }

  effect.options = options; // effect所有属性

  effect.id = uid++; // effect的标号

  effect.deps = []; // effect函数对应的属性.依赖的收集是相互的

  return effect;
}

//targetMap 数据结构：WeakMap和Map和Set。
// WeakMap为总的结构，每个传入reactive的参数(进行响应式的数据)作为属性名，值是Map对象，值里面的属性名是参数的属性名，属性名的值是Set
// Set里面放的就是收集起来的effect
// {
//   {name:ck，age:24}:{
//     name:[effect1, effect2],
//     age:[effect1]
//   },
//   {sex:man，height:180}:{
//     sex:[effect3, effect4],
//     height:[effect5,effect6]
//   }
// }

const targetMap = new WeakMap()

// track就是get中进行依赖收集的函数
export function track(target, type, key) {

  // activeEffect就是Dep.target的作用
  if (activeEffect == undefined) {
      return;
  }

  先看看targetMap有没这个数据
  let depsMap = targetMap.get(target);

  if (!depsMap) { // 如果没有map，增加map
      targetMap.set(target, (depsMap = new Map()));
  }
  // depsMap = new Map()表示给其赋值

  // 再拿数据里面的属性
  let dep = depsMap.get(key); // 取对应属性的依赖表
  if (!dep) { // 如果没有则构建set
      depsMap.set(key, (dep = new Set()));
  }

  // 如果有了这个effect就不再重复添加
  if(!dep.has(activeEffect)){ 
      // 添加effect
      dep.add(activeEffect);

      // 同时effect中也要添加这个属性dep。dep是个Set
      activeEffect.deps.push(dep);
  }
}


// trigger就是set中进行派发更新的函数
export function trigger(target, type, key) {

  // 拿到数据
  const depsMap = targetMap.get(target);

  if (!depsMap) {
      return;
  }

  // 定义run方法，用来遍历执行effect数组
  const run = (effects) => {
      if (effects) {effects.forEach(effect => effect());}
  }

  // 有key 就找到对应的key的依赖执行
  // void 运算符能对给定的表达式进行求值，然后返回 undefined。也就是说，void 后面你随便跟上一个表达式，返回的都是 undefined
  // void 0是undefined备选方案，换句话说void 0和undefined是等价的
  if (key !== void 0) {
    // depsMap.get(key)就是effect数组（Set结构的数组）：[effect1,effect2,....]
      run(depsMap.get(key));
  }

  // 但是对于数组来说：arr = [1,2,3],如果使用arr.push(4)
  // 也会触发trigger。但是4所在的3这个索引并没有进行依赖收集
  // 但是push方法在加入4的时候，也会对length属性进行更改，因此length中进行了依赖收集

  // 数组新增属性，因为没有对其索引进行依赖收集，所以当时新增的时候，触发length收集的依赖
  if (type == TriggerOpTypes.ADD) {
      // 如果是数组的话，就传入depsMap.get(length)，使用length属性收集的依赖
      run( depsMap.get( isArray(target) ? 'length' : '' ) );
  }

}