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

</style>
