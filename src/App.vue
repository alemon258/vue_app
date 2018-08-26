<template>
  <div id="app">
        <v-header/>
    <router-view/>
  </div>
</template>

<script>

import Header from './components/headers' 

export default {
    name: 'App',

    components: {
       'v-header': Header               
    }
}
</script>

<style>
.el-popover{
    min-width: 15px;
    background-color: rgba(0,0,0,0);
    color: rgba(0,0,0,0);
    border: 0;
    padding: 0;
    text-align: center;
}
#app{
    background-image: url('../static/images/bg.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    height: 100vh;
}

.el-popper[x-placement^=top] .popper__arrow{
    border-top-color: rgba(0,0,0,0.05)

}
.el-popper[x-placement^=top] .popper__arrow::after{
    border-top-color: rgba(0,0,0,0.05)
}


</style>
