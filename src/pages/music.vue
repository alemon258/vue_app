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
                            v-loading="loading"
                            element-loading-text="拼命加载中"
                            element-loading-spinner="el-icon-loading"
                            element-loading-background="rgba(0, 0, 0, 0.8)"
                            stripe
                            :data="musics"
                            style="width: 100%"
                            height= '100%'
                            @row-click="playMusic">
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
                    <div class="music-info">
                       <audio   
                       style="display:none"
                       ref="audio"
                       @pause="onPause"
                       @play="onPlay"
                       @timeupdate="onTimeupdate" 
                       @loadedmetadata="onLoadedmetadata">
                            <source src="" type="audio/mpeg">
                        </audio>
                        <h2>{{musics[audio.index].name}}</h2>
                        <Scroll
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
                        <el-button slot="reference" icon="el-icon-service"  circle></el-button>
                    </el-popover>
                    
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
            // rowClass({row, rowIndex}){
            //     console.log(rowIndex)
            //     if(rowIndex > 0){
            //         return 'style-row'
            //     } else{
            //         return ''
            //     }
            // },

            playMusic(row, event, column){
                let id = row.id
                this.$refs.audio.src = "http://music.163.com/song/media/outer/url?id="+ id +".mp3"
                this.audio.index = row.index
                this.isChange = true
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
                if(this.audio.index){
                    this.audio.index = this.audio.index - 1
                    let id = this.musics[this.audio.index].id
                    this.$refs.audio.src = "http://music.163.com/song/media/outer/url?id="+ id +".mp3"
                    this.isChange = true
                }
            },
            //播放下一曲
            playNext(){
                if(this.audio.index != this.musics.length - 1){
                    this.audio.index = this.audio.index + 1
                    let id = this.musics[this.audio.index].id
                    this.$refs.audio.src = "http://music.163.com/song/media/outer/url?id="+ id +".mp3"
                    this.isChange = true
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
                    this.playNext()
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
                    console.log(err)
                })
            },
            //歌词刷新
            lyricRefresh(){
                let lineEl = this.$refs.lyricLine[0]
                this.$refs.lyricList.scrollToElement(lineEl, 1000)
            },

            handleLyric({lineNum, txt}){
                this.currentLineNum = lineNum

                if (lineNum > 5) {
                    let lineEl = this.$refs.lyricLine[lineNum - 5]
                    // 结合better-scroll，滚动歌词
                    this.$refs.lyricList.scrollToElement(lineEl, 1000)
                    } else {
                        let lineEl2 = this.$refs.lyricLine[0]
                        this.$refs.lyricList.scrollToElement(lineEl2,  1000)
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
        }
 
    }

    //鼠标划入滚动条展现，鼠标划出滚动条隐藏



 
</script>


<style>
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
    height: 400px;
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
    width: calc(100% - 400px)
}

.el-form-item__content{
    width: 100%;
}
.el-input__inner{
    background-color: rgba(0,0,0,0);
    color:aquamarine
}
</style>
