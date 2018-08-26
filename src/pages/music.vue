<template>
    <div>
        <el-container>
            <el-main>
                <el-row>
                  <el-button round>正在播放</el-button>
                  <el-button round>我的收藏</el-button>
                  <el-button round>排行榜</el-button>
                  <el-button round>搜索音乐</el-button>
                </el-row>
                <div class="music-content">
                    <template class="music -body">
                        <el-table
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
                            min-width= 10%>
                            </el-table-column>
                        </el-table>
                    </template>
                    <div class="music-info">
                       <audio 
                       autoplay
                       style="display:none"
                       ref="audio"
                       @pause="onPause"
                       @play="onPlay"
                       @timeupdate="onTimeupdate" 
                       @loadedmetadata="onLoadedmetadata">
                            <source src="" type="audio/mpeg">
                        </audio>

                        
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
                sliderTime: 0,
                audio: {
                    playing: false,
                    // 音频当前播放时长
                    currentTime: 0,
                    // 音频最大播放时长
                    maxTime: 0,
                    //当前播放id
                    id: 0,
                    //音量
                    volume: 50
                },
            }
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
                this.play()
            },

            formatTooltip(index = 0){
                index = parseInt(this.audio.maxTime / 100 * index)
                return realFormatSecond(index)
            },

            changeSliderTime(index){
                this.$refs.audio.currentTime = parseInt(index / 100 * this.audio.maxTime)
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
                    console.log(this.audio.index)
                    this.play()
                }
            },
            //播放下一曲
            playNext(){
                if(this.audio.index != this.musics.length - 1){
                    this.audio.index = this.audio.index + 1
                    let id = this.musics[this.audio.index].id
                    this.$refs.audio.src = "http://music.163.com/song/media/outer/url?id="+ id +".mp3"
                    console.log(this.audio.index)
                    this.play()
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
            },
            // 当音频暂停
            onPause () {
            this.audio.playing = false
            },
            // 当timeupdate事件大概每秒一次，用来更新音频流的当前播放时间
            onTimeupdate(res) {
                this.audio.currentTime = parseInt(res.target.currentTime)
                this.sliderTime = parseInt(this.audio.currentTime / this.audio.maxTime * 100)
                if (this.audio.currentTime && this.audio.currentTime == this.audio.maxTime) {
                    this.playNext()
                }
                },
            // 当加载语音流元数据完成后，会触发该事件的回调函数
            // 语音元数据主要是语音的长度之类的数据
            onLoadedmetadata(res) {
            this.$refs.audio.volume = this.audio.volume / 100
            this.audio.maxTime = parseInt(res.target.duration)
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
            axios.get(API_POROXY + 'http://music.163.com/api/playlist/detail?id=19723756')
            .then((res) => {
                let data = res.data.result.tracks
                console.log(data)
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
                console.log(self.musics)
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
    padding: 15px;
    height: calc(100% - 200px);
    display: flex;
}

.music-info{
    width: 25%;
}

.time{
    border: 0;
    font-size: 14px;
    width: 120px;
    padding: 5px 10px;
}

.music -body{
    width: 75%;
}

.el-main{
    padding: 20px 80px 0px;
    height: 100vh;
    margin-bottom: -76px;
}

.music-progress{
    display: flex;
}

.slider{
    width: calc(100% - 400px)
}
</style>
