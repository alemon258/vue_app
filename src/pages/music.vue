<template>
    <div>
        <el-container>
            <el-main class="main">
                <div class="music-title">
                    <div style="width:75%;position:relative">
                  <!-- <el-button round>正在播放</el-button>
                  <el-button round>我的收藏</el-button>
                  <el-button round>排行榜</el-button> -->
                    <el-form :inline="true" :model="formInline" class="search">
                        <el-form-item style="width:100%">
                            <el-input v-model="formInline.search" @keyup.enter.native="onSearch"  placeholder="搜索" style="width:70%;"></el-input>
                        </el-form-item>
                    </el-form>
                    </div>
                </div>
                <div class="music-content">
                    <template class="music-body">
                        <el-table
                            ref="table"
                            v-loading="loading"
                            element-loading-text="拼命加载中"
                            element-loading-spinner="el-icon-loading"
                            element-loading-background="rgba(0, 0, 0, 0.8)"
                            stripe
                            :highlight-current-row = true
                            :data="musics"
                            style="width: 100%; color:rgb(213, 252, 255);"
                            height= '100%'
                            @row-click="clickPlayMusic">
                            <el-table-column
                            type='index'
                            width= "50">
                            </el-table-column>
                            <el-table-column
                            prop="name"
                            label="歌曲"
                            >
                            </el-table-column>
                            <el-table-column
                            prop="singer"
                            label="歌手"
                            min-width= 20% >
                            </el-table-column>
                            <el-table-column
                            prop="album"
                            label="专辑"
                            min-width = 20%>
                            </el-table-column>
                            <el-table-column
                            prop="time"
                            label="时长"
                            width= 50>
                            </el-table-column>
                        </el-table>
                    </template>
                    

                    <!-- music lyric -->
                    <div class="music-info">
                       <audio   
                       style="display:none"
                       ref="audio"
                       @pause="onPause"
                       @play="onPlay"
                       @timeupdate="onTimeupdate" 
                       @loadedmetadata="onLoadedmetadata"
                       @error="onLoadError">
                            <source src="" type="audio/mpeg">
                        </audio>
                        <h2>{{musics[audio.index].name}}</h2>
                        <Scroll
                        id="inner"
                        ref="lyricList"
                        class="lyric"
                        :data="currentLyric && currentLyric.lines"
                        :mouseWheel="true">
                        <div>
                            <ul class="content" v-if="currentLyric">
                                    <p ref="lyricLine" 
                                    class="text"
                                    :class="{'current': currentLineNum === index}"
                                    v-for="(line, index) in currentLyric.lines"
                                    :key="index">{{line.txt}}
                                    </p>
                            </ul>
                        </div>
                        </Scroll>
                            


                        
                    </div>
                </div>
                <div class="music-progress">                   
                        <!-- 音频播放控件 -->   
                    <div style="width:200px">
                        <el-button  icon="el-icon-arrow-left" @click="playPrev" circle></el-button>
                        <el-button type="primary" @click="startPlayOrPause" >{{audio.playing | transPlayPause}}</el-button>
                        <el-button  icon="el-icon-arrow-right" @click="playNext" circle></el-button>
                    </div>
                    <div class="slider">
                        <el-slider
                        v-model="sliderTime" 
                        :format-tooltip="formatTooltip"
                        @change="changeSliderTime"
                        :show-tooltip="true"></el-slider>
                    </div>
                    <el-tag color="rgba(0,0,0,0)" class="time">{{ audio.currentTime | formatSecond}}/{{ audio.maxTime | formatSecond}}</el-tag>
                    <el-popover
                    placement="top-start"
                    trigger="hover">
                        <el-slider 
                        v-model="audio.volume" 
                        @change="changeVolume"
                        vertical
                        height="200px"> 
                        </el-slider>
                        <el-button slot="reference" icon="el-icon-service"  circle style="margin-right:50px"></el-button>
                    </el-popover>
                    <el-button :icon="playSortIcon" circle @click="changePlaySort"></el-button>
                </div>
            </el-main>
        </el-container>
    </div>
</template>


<script>

import axios from 'axios'
import qs from 'qs'
//引入歌词解析
import Lyric from 'lyric-parser'
//歌词滚动
import Scroll from '../components/scroll'

const API_POROXY = 'https://bird.ioliu.cn/v1/?url='

//格式化时间
function realFormatSecond(second) {
    var secondType = typeof second

    if (secondType === 'number' || secondType === 'string') {
        second = parseInt(second)

        var hours = Math.floor(second / 3600)
        second = second - hours * 3600
        var mimute = Math.floor(second / 60)
        second = second - mimute * 60

        return hours + ':' + ('0' + mimute).slice(-2) + ':' + ('0' + second).slice(-2)
    } else {
        return '0:00:00'
    }
}



    export default{
        data() {
            return {
                musics:[{
                    index: '0',
                    name: "",
                    singer: '',
                    album: '',
                    time: '',
                    id: ''
                }],
                formInline:{
                    search:''
                },
                //歌曲播放模式，默认顺序播放
                playSort: 'repeat-all',
                //播放模式图标
                playSortIcon: 'el-icon-d-arrow-right',
                //歌曲是否改变
                isChange: false,
                //当前高亮歌词
                currentLineNum: 0,  
                sliderTime: 0,
                currentLyric: null,
                audio: {
                    playing: false,
                    // 音频当前播放时长
                    currentTime: 0,
                    // 音频最大播放时长
                    maxTime: 0,
                    //当前播放index
                    index: 0,
                    //音量
                    volume: 50,
                    //歌词
                    lrc:''
                },
                loading: true,
            }
        },

        components: {
            Scroll
        },

        methods: {

            //歌曲不能播放，播放下一曲
            onLoadError(){
               this.playNext()
            },
            //改变播放顺序
            changePlaySort(){
                if(this.playSort == 'repeat-all'){
                    this.playSort = 'shuffle'
                    this.playSortIcon = 'el-icon-question'
                } else if(this.playSort == 'shuffle'){
                    this.playSort = 'repeat-one'
                    this.playSortIcon = 'el-icon-refresh'
                } else{
                    this.playSort = 'repeat-all'
                    this.playSortIcon = 'el-icon-d-arrow-right'
                }
            },
            //播放音乐
            playMusic(){
                //切换高亮行
                this.$refs.table.setCurrentRow(this.musics[this.audio.index])
                let id = this.musics[this.audio.index].id
                this.$refs.audio.src = "http://music.163.com/song/media/outer/url?id="+ id +".mp3"
                this.isChange = true
            },
            //点击列表播放
            clickPlayMusic(row, event, column){
                this.audio.index = row.index
                this.playMusic()
            },

            formatTooltip(index = 0){
                index = parseInt(this.audio.maxTime / 100 * index)
                return realFormatSecond(index)
            },

            changeSliderTime(index){
                this.$refs.audio.currentTime = parseInt(index / 100 * this.audio.maxTime)
                //设置歌词播放时间
                this.currentLyric.seek(this.$refs.audio.currentTime*1000)
                if(!this.audio.playing){
                    this.currentLyric.togglePlay()
                }
            },

            changeVolume(index){
                this.$refs.audio.volume = index/100
            },

                    // 控制音频的播放与暂停
            startPlayOrPause () {
            return this.audio.playing ? this.pause() : this.play()
            },
            //播放上一曲
            playPrev(){
                if(this.playSort == 'shuffle'){
                    this.audio.index =parseInt( Math.random() * this.musics.length )
                    this.playMusic()
                } else if(this.audio.index){
                    this.audio.index = this.audio.index - 1
                    this.playMusic()
                }
            },
            //播放下一曲
            playNext(){
                if(this.playSort == 'shuffle'){
                    this.audio.index =parseInt( Math.random() * this.musics.length )
                    this.playMusic()
                }else if (this.audio.index == this.musics.length - 1){
                    this.audio.index = 0
                    this.playMusic()
                }else{
                    this.audio.index = this.audio.index + 1
                    this.playMusic()
                }
            },
            // 播放音频
            play () {
            this.$refs.audio.play()
            },
            // 暂停音频
            pause () {
            this.$refs.audio.pause()
            },
            // 当音频播放
            onPlay () {
            this.audio.playing = true
            this.currentLyric.togglePlay()                
            },
            // 当音频暂停
            onPause () {
            this.audio.playing = false
            this.currentLyric.togglePlay()
            },
            // 当timeupdate事件大概每秒一次，用来更新音频流的当前播放时间
            onTimeupdate(res) {
                this.audio.currentTime = parseInt(res.target.currentTime)
                this.sliderTime = parseInt(this.audio.currentTime / this.audio.maxTime * 100)
                //自动播放
                if (this.audio.currentTime && this.audio.currentTime == this.audio.maxTime) {
                    if(this.playSort == 'repeat-all'){
                        this.playNext()
                    } else if(this.playSort == 'repeat-one'){
                        this.play()
                        this.currentLyric.play()
                    } else if(this.playSort == 'shuffle') {
                        this.audio.index =parseInt( Math.random() * this.musics.length )
                        this.playMusic()
                    }

                }
                },
            // 当加载语音流元数据完成后，会触发该事件的回调函数
            // 语音元数据主要是语音的长度之类的数据
            onLoadedmetadata(res) {
            this.$refs.audio.volume = this.audio.volume / 100
            this.audio.maxTime = parseInt(res.target.duration)
            //停止上一首歌词
            if(this.isChange){
                this.currentLyric.stop()
            }
            this.loadLyric(this.musics[this.audio.index].id)
            },

            //加载歌词
            loadLyric(id){
                let url = API_POROXY + 'http://music.163.com/api/song/lyric'
                axios.get(url,{
                    params: {id: id,lv: -1, kv: -1, tv: -1}
                }).then((res) => {
                    let lrc = res.data.lrc.lyric
                    this.currentLyric = new Lyric(lrc, this.handleLyric)
                    this.$nextTick(()=>{
                        this.lyricRefresh()
                    })
                    //刚开始不播放
                    if(this.isChange){
                        this.play()
                    }
                    //this.audio.lrc = res.data.lrc.lyric
                }).catch((err) => {
                    //没有歌词
                    let lrc = ''
                    this.currentLyric = new Lyric(lrc, this.handleLyric)
                    this.$nextTick(()=>{
                        this.lyricRefresh()
                    })
                    //刚开始不播放
                    if(this.isChange){
                        this.play()
                    }
                })
            },
            //歌词刷新
            lyricRefresh(){
                let lineEl = this.$refs.lyricLine[0]
                this.$refs.lyricList.scrollToElement(lineEl, 1000)
            },

            handleLyric({lineNum, txt}){
                this.currentLineNum = lineNum
                //判断歌词面板的高度
                if(document.getElementById("inner").offsetHeight < 300){
                    if (lineNum > 3) {
                    let lineEl = this.$refs.lyricLine[lineNum - 3]
                    // 结合better-scroll，滚动歌词
                    this.$refs.lyricList.scrollToElement(lineEl, 1000)
                    } else {
                        let lineEl2 = this.$refs.lyricLine[0]
                        this.$refs.lyricList.scrollToElement(lineEl2,  1000)
                    }
                }else{
                    if (lineNum > 4) {
                    let lineEl = this.$refs.lyricLine[lineNum - 4]
                    // 结合better-scroll，滚动歌词
                    this.$refs.lyricList.scrollToElement(lineEl, 1000)
                    } else {
                        let lineEl2 = this.$refs.lyricLine[0]
                        this.$refs.lyricList.scrollToElement(lineEl2,  1000)
                    }
                }
                
            },

            //查询
            onSearch(){
                this.loading = true
                let url = API_POROXY + 'http://music.163.com/api/search/pc'
                let data = {
                                        s: this.formInline.search,
                                        offset: 0,
                                        limit: 100,
                                        type: 1
                                    }
                axios.post(url, qs.stringify(data),{
                    headers:{
                        'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                    },                  
                }).then((res) => {
                    this.musics = []
                    let data = res.data.result.songs
                    data.forEach((element,index) => {
                        let music = {name:'', singer:'', id: '', time: '',album: '',index:''}
                        music.index = index 
                        music.name = element.name
                        music.singer = element.artists[0].name
                        if (element.artists.length > 1) {
                            element.artists.forEach((singers, index) => {
                                if (index > 0){   
                                    music.singer += '/' + singers.name  
                                }
                            })
                        }
                        music.id = element.id
                        //转换时间
                        let playtime = parseInt(element.bMusic.playTime/1000)
                        let m = parseInt(playtime/60)
                        let s = playtime%60
                        if (s/10 < 1){
                            s = '0' + s
                        } 
                        music.time = m + ':' + s
                        music.album = element.album.name
                        this.musics.push(music)
                })
                this.loading = false
            }).catch((err) =>{
                console.log(err)
            })
            }
        },
        filters: {
            // 使用组件过滤器来动态改变按钮的显示
            transPlayPause(value) {
            return value ? '暂停' : '播放'
            },
            // 将整数转化成时分秒
            formatSecond(second = 0) {
            return realFormatSecond(second)
            }
        },

        mounted() {
            let self = this
            axios.get(API_POROXY + 'http://music.163.com/api/playlist/detail?id=3779629')
            .then((res) => {
                let data = res.data.result.tracks
                data.forEach((element,index) => {
                    let music = {name:'', singer:'', id: '', time: '',album: '',index:''}
                    music.index = index 
                    music.name = element.name
                    music.singer = element.artists[0].name
                    if (element.artists.length > 1) {
                        element.artists.forEach((singers, index) => {
                            if (index > 0){   
                                music.singer += '/' + singers.name  
                            }
                        })
                    }
                    music.id = element.id
                    //转换时间
                    let playtime = parseInt(element.bMusic.playTime/1000)
                    let m = parseInt(playtime/60)
                    let s = playtime%60
                    if (s/10 < 1){
                        s = '0' + s
                    } 
                    music.time = m + ':' + s
                    music.album = element.album.name
                    self.musics.push(music)
                })
                 self.musics.splice(0,1)
                 self.loading = false
                 this.$refs.audio.src = "http://music.163.com/song/media/outer/url?id="+ this.musics[this.audio.index].id +".mp3"
            }).catch((err) => {
                console.log(err)
            })

            //加载滚动条，但是不显示
            document.getElementsByClassName('el-table__body-wrapper')[0].classList.add('scrollbarHide')

            var timeout = false
            //绑定滚动事件
            document.getElementsByClassName('el-table__body-wrapper')[0].onscroll = () => {
                document.getElementsByClassName('el-table__body-wrapper')[0].classList.add('scrollbarShow')
                
                if (timeout){
                    clearTimeout(timeout)
                    }
                timeout = setTimeout(() => {
                    document.getElementsByClassName('el-table__body-wrapper')[0].classList.remove('scrollbarShow')
                }, 500) 
                 
            }
        },
         
    }



 
</script>


<style>

/* ::-webkit-scrollbar {width:7px; height:10px; background-color:transparent;} 定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸 */
/* ::-webkit-scrollbar-track {background-color:#f0f6ff;  } 定义滚动条轨道 内阴影+圆角 */
/* ::-webkit-scrollbar-thumb {background-color:#73abb1; border-radius:6px;} 定义滑块 内阴影+圆角 */
.scrollbarHide::-webkit-scrollbar{display: none;}
.scrollbarShow::-webkit-scrollbar{display: block;}
.scrollbarShow::-webkit-scrollbar{
    width:7px; height:10px;
    background-color:rgba(0,0,0,0.1);
    border-radius:6px;
}

.scrollbarShow::-webkit-scrollbar-thumb{
    background-color:#73abb1;
    border-radius:6px;
}



.el-table{
    background-color: rgba(0,0,0,0);
}

.el-table tr, .el-table th{
    background-color: rgba(0,0,0,0);
}

.el-table--striped .el-table__body tr.el-table__row--striped td{
    background-color: rgba(0,0,0,0);
}

.el-table--striped .el-table__body tr.el-table__row--striped.current-row td,.el-table__body tr.current-row>td{
    background-color: rgba(11, 22,33,.5)
}

.el-table--enable-row-hover .el-table__body tr:hover>td{
    background-color: rgba(11, 22,33,.5)
}

.el-table td{
    border: 0;
}

.music-content{
    margin: 0 ;
    padding: 15px 0 15px 0;
    height: calc(100% - 200px);
    display: flex;
}

.music-info{
    width: 25%;
    text-align: center;
    position: relative;
}

.current{
    color: aqua;
}

.lyric{
    height:50%;
    overflow: hidden;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
}

.content{
    padding: 0;
}

.time{
    border: 0;
    font-size: 14px;
    width: 120px;
    padding: 5px 10px;
}

.music-title{
    display:flex;
     height:40px; 
     padding-left: 15px;
     padding-right: 15px;
}

.search{
    position: absolute;
    left:50%;
    transform: translateX(-50%);
    width: 70%;
    text-align: center;
}

.music -body{
    width: 75%;
}

.main{
    padding: 20px 0px 0px 80px;
    height: 100vh;
    margin-bottom: -76px;
}

.music-progress{
    display: flex;
}

.slider{
    width: calc(100% - 500px)
}

.el-form-item__content{
    width: 100%;
}
.el-input__inner{
    background-color: rgba(0,0,0,0);
    color:aquamarine
}
</style>
