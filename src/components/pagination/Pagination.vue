<!--
 * @Description: 
 * @Author: gcz
 * @Date: 2022-11-21 14:51:21
 * @LastEditors: gcz
 * @LastEditTime: 2022-11-21 14:51:23
 * @FilePath: \codeHome\src\components\pagination\Pagination.vue
 * @Copyright: Copyright (c) 2016~2022 by gcz, All Rights Reserved. 
-->
<template>
    <div class="pagination my-pagination">
      <span class="total-text">共{{ total }}条数据</span>
      <button type="button" class="arrow" :class="{'disbled': currentPage == 1}" :disabled="currentPage == 1" @click="onLastPage">
        <svg
          t="1650466331072"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11364"
          width="14"
          height="14"
          :opacity="currentPage == 1 ? 0.3 : 1"
        >
          <path
            d="M410.7 512.4L749.1 174c24.9-24.9 24.9-65.6 0-90.5-24.9-24.9-65.6-24.9-90.5 0L274.9 467.2c-6.2 6.2-10.9 13.4-14 21.1-5.4 13.5-6.1 28.5-2 42.4 0.6 2 1.3 3.9 2 5.9 3.1 7.7 7.8 14.9 14 21.1l383.6 383.6c24.9 24.9 65.6 24.9 90.5 0 24.9-24.9 24.9-65.6 0-90.5L410.7 512.4z"
            p-id="11365"
            fill="#000000"
          ></path>
        </svg>
      </button>
      <button type="button" :class="{'active': currentPage == 1}" v-if="currentPage > parseInt(continues / 2) + 1" @click="onChangePage(1)">1</button>
      <span class="ellipsis" v-if="currentPage > parseInt(continues / 2) + 1">...</span>
      <button type="button" :class="{'active': currentPage == item}" v-for="item in middleArrayList" :key="item" @click="onChangePage(item)">{{ item }}</button>
      <span class="ellipsis" v-if="currentPage <= totalPage - (parseInt(continues / 2) + 1)">...</span>
      <button type="button" v-if="currentPage < totalPage - parseInt(continues / 2)" @click="onChangePage(totalPage)">{{ totalPage }}</button>
      <button type="button" class="arrow" :class="{'disbled': currentPage == totalPage}" :disabled="currentPage == totalPage" @click="onNextPage">
        <svg
          t="1650466428093"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="11841"
          width="14"
          height="14"
          :opacity="currentPage == totalPage ? 0.3 : 1"
        >
          <path
            d="M613.3 512.4L274.9 850.8c-24.9 24.9-24.9 65.6 0 90.5 24.9 24.9 65.6 24.9 90.5 0L749 557.7c6.2-6.2 10.9-13.4 14-21.1 5.4-13.5 6.1-28.5 2-42.4-0.6-2-1.3-3.9-2-5.9-3.1-7.7-7.8-14.9-14-21.1L365.4 83.5c-24.9-24.9-65.6-24.9-90.5 0-24.9 24.9-24.9 65.6 0 90.5l338.4 338.4z"
            p-id="11842"
            fill="#000000"
          ></path>
        </svg>
      </button>
    </div>
  </template>
  
  <script>
  export default {
    name: "Pagination",
    data() {
      return {
        title: "Pagination",
        currentPage: 1
      };
    },
    props: {
        total: {
            type: Number,
            default: 125
        },
        pageSize: {
            type: Number,
            default: 12
        },
        pageNo: {
            type: Number,
            default: 1
        },
        continues: {
            type: Number,
            default: 5
        }
    },
    created(){
      this.currentPage = this.pageNo
    },
    computed: {
        totalPage() {
            const { total, pageSize } = this;
            return Math.ceil(total / pageSize);
        },
        middleArrayRang() {
            const { continues, totalPage, currentPage } = this;
            let start = 0;
            let end = 0;
            if(continues > totalPage) {
                start = 1;
                end = totalPage;
            } else {
                const num = parseInt(continues / 2);
                start = currentPage - num;
                end = currentPage + num;
                if(start < 1) {
                    start = 1;
                    end = continues;
                }
                if(end > totalPage) {
                    start = totalPage - continues + 1;
                    end = totalPage;
                }
            }
            return {
                start,
                end
            };
        },
        middleArrayList() {
            let arryList = [];
            const { start, end } = this.middleArrayRang;
            for(let i = 0; i <= end; i++) {
                if(i >= start) {
                    arryList.push(i);
                }
            }
            return arryList;
        }
    },
    methods: {
        onLastPage() {
            this.currentPage = this.currentPage - 1;
            this.onEmitCurrenPage();
        },
        onNextPage() {
            this.currentPage = this.currentPage + 1;
            this.onEmitCurrenPage();
        },
        onChangePage(pageNum) {
            this.currentPage = pageNum;
            this.onEmitCurrenPage();
        },
        onEmitCurrenPage() {
          this.$emit('onChangePage', this.currentPage);
        }
    }
  };
  </script>
  
  <style lang='scss' scoped>
  .my-pagination.pagination {
      display: flex;
      align-items: center;
  }
  .my-pagination .total-text {
      margin-right: 16px;
  }
  .my-pagination button {
      width: 32px;
      height: 32px;
      font-size: 16px;
      margin-right: 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
  }
  .my-pagination .ellipsis {
      margin-right: 16px;
  }
  .my-pagination .active {
      background-color: #000000;
      color: #ffffff;
  }
  .my-pagination .disbled {
      cursor: not-allowed;
  }
  </style>