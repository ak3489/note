<!--
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-23 17:05:56
 * @LastEditors: gcz
 * @LastEditTime: 2025-05-19 09:27:24
 * @FilePath: \codeHome\src\views\Share.vue
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
-->
<template>
    <div class=''>
        <section class="code">
            <div class="title">{{activeCode.noteTitle}}</div>
            <mavon-editor 
                class="mavonEditor" 
                v-model="activeCode.noteContent" 
                :toolbars="toolbars"
                :toolbarsFlag="false"
                :html="false"
                :subfield="subfield"
                :defaultOpen="defaultOpen"
                codeStyle="atom-one-dark"
            />
        </section>
        <button class="bottom-btn" @click="$router.push({path:'/'})">返回首页</button>
        <s3-layer
            v-model="needpass"
            :btn="['确认']"
            :closeBtn="2"
            area="400px"
            title="分享密码"
            @yes="confirmSharePass"
        >
            <div>
                <div class="" v-if="enterpassCount">需要正确的密码 {{enterpassCount}}次</div>
            <span style="margin-right:8px">分享密码</span>
            <input type="text" v-model="notePass" maxlength="18" placeholder="分享密码">
            </div>
        </s3-layer>
    </div>
</template>

<script>
import { getShareCode } from '@/service/index';
    export default {
        name: 'Share',
        components: {},
        data () {
            return {
                shareId:'',
                notePass:'',
                needpass:false,
                enterpassCount:0,
                subfield:true,
                defaultOpen:'preview',
                activeCode:{noteContent:''},
                toolbars : {
                    bold: true, // 粗体
                    italic: true, // 斜体
                    header: true, // 标题
                    underline: true, // 下划线
                    strikethrough: true, // 中划线
                    mark: true, // 标记
                    superscript: true, // 上角标
                    subscript: true, // 下角标
                    quote: true, // 引用
                    ol: true, // 有序列表
                    ul: true, // 无序列表
                    link: true, // 链接
                    imagelink: true, // 图片链接
                    code: true, // code
                    table: true, // 表格
                    fullscreen: true, // 全屏编辑
                    readmodel: true, // 沉浸式阅读
                    htmlcode: true, // 展示html源码
                    help: true, // 帮助
                    /* 1.3.5 */
                    undo: true, // 上一步
                    redo: true, // 下一步
                    trash: true, // 清空
                    save: false, // 保存（触发events中的save事件）
                    /* 1.4.2 */
                    navigation: true, // 导航目录
                    /* 2.1.8 */
                    alignleft: true, // 左对齐
                    aligncenter: true, // 居中
                    alignright: true, // 右对齐
                    /* 2.2.1 */
                    subfield: true, // 单双栏模式
                    preview: true, // 预览
                }
            };
        },
        created(){
            // console.log(this.$route.query);
            this.shareId = this.$route.query.shareId;
            if(this.shareId){
                this.getShareCode(this.shareId)
            }
            this.notePass = localStorage.getItem(this.shareId);
            if(this.notePass){
                this.getShareCode(this.shareId,this.notePass)
            }

            let clientWidth = document.documentElement.clientWidth;
            // if(clientWidth<1200){
                this.subfield = false
                this.defaultOpen = 'preview'
            // }
        },
        methods: {
            async getShareCode(shareId,notePass){
                let {code,data,msg} = await getShareCode(shareId,notePass);
                if(data){                    
                    if(data=='needpass'){
                        this.needpass = true;
                        this.notePass = '';
                        localStorage.removeItem(this.shareId);
                        // alert('需要正确的密码')
                    }else{
                        this.needpass = false;
                        this.activeCode = data;
                        this.enterpassCount =0;
                        localStorage.setItem(this.shareId,notePass);
                        // 设置网页标题
                        document.title = this.activeCode.noteTitle;
                    }
                }else{
                    this.$router.push({path:'/'})
                }
                
            },
            confirmSharePass(){
                this.enterpassCount +=1;
                this.getShareCode(this.shareId,this.notePass)
            }
        },
    }
</script>

<style lang='scss' scoped>
@media screen and (min-width: 1200px) {
    .code{
        width: 1200px;
        margin: 0 auto;
    }
}
//@import url()
.title{
    height: 36px;
    color: #fff;
    padding: 16px;
    font-size: 16px;
}
.v-note-wrapper{
    height:  calc( 100vh - 36px - 32px - 24px );
    border-radius: 5px;
    overflow: hidden;
}
</style>