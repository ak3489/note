<!--
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-25 09:53:39
 * @LastEditors: gcz
 * @LastEditTime: 2022-11-25 10:43:10
 * @FilePath: \codeHome\src\views\unLogin.vue
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
-->
<template>
    <div class=''>
        <section class="code">
            <mavon-editor class="mavonEditor" v-model="activeCode.noteContent" :toolbars="toolbars" />
        </section>
        <button class="bottom-btn" @click="$router.push({path:'/home'})">登录</button>
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
                activeCode:{
                    noteContent:''
                },
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
            this.getShareCode('63802a72eb35490147f51a2f')
        },
        methods: {
            async getShareCode(shareId){
                let {code,data,msg} = await getShareCode(shareId);
                if(data){
                    this.activeCode = data
                }
                
            }
        },
    }
</script>

<style lang='scss' scoped>
//@import url()
.v-note-wrapper{
    height: 100vh;
}
.bottom-btn{
    left: 50%;
    right: auto;
    margin-left: -35px;
    bottom: auto;
    top: 50%;
}
</style>