<template>
    <div id="headers">
        <el-container>
            <el-header>
                <el-menu 
                :default-active="activeIndex" 
                 mode="horizontal" 
                 @select="handleSelect"
                 :router= true>
                    <el-menu-item index="/">首页</el-menu-item>
                    <el-menu-item index="/blog">博客</el-menu-item>
                    <el-menu-item index="/music">音乐</el-menu-item>
                </el-menu>
            </el-header>
        </el-container>
    </div>
</template>

<script>
    export default{
        name: 'headers',
        data(){
            return {
                activeIndex: ''
            }
        },

        methods: {
            handleSelect(index, path){
                console.log(index, path)
            }
        },

        watch: {
            $route: {handler(to, from) {
                let path = to.path
                this.activeIndex = to.path              
            }}
        },

        created(){
            this.activeIndex = this.$route.path
        }
    }
</script>

<style scoped>
.el-menu{
    background-color: rgba(0,0,0,0);
}
</style>
