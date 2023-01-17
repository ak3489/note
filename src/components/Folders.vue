<script setup>
import { ref, onMounted, getCurrentInstance } from "vue";
import { addFolderApi, editFolderApi,delFolderApi } from "@/service/index";
const props = defineProps(["folderList", "userId"]);
const emit = defineEmits(["folderClick", "getFolders"]);
const instance = getCurrentInstance();
const _this = instance.appContext.config.globalProperties;
let folderIndex = ref(0);
function folderClick(item, index) {
  //   queryParams.value.pageNo = 1;
  folderIndex.value = index;
  emit("folderClick", index);
}

let showAddFolder = ref(false);
let folderTool = ref("");
let editFolderForm = ref();
let addFolderForm = ref({ folderName: "", userId: props.userId });
function addFolder() {
  folderTool.value = "add";
  showAddFolder.value = true;
}
async function confirmAddFolder() {
  console.log("folderTool.value", folderTool.value);
  // console.log('addFolderForm',addFolderForm.value);
  addFolderForm.value.userId = props.userId;
  if (!addFolderForm.value.userId) {
    layer.msg("请确认已经登录,或者等待页面加载完成重试!");
  }
  let hasType = props.folderList.some(function (item) {
    console.log("item", item);
    console.log("folderList.value.folderName", props.folderList.folderName);
    return item.folderName == addFolderForm.value.folderName;
  });
  if (hasType) {
    layer.msg("已经有了");
    return false;
  }

  showAddFolder.value = false;
  if (folderTool.value == "add") {
    let { code, data, msg } = await addFolderApi(addFolderForm.value);
    layer.msg(msg);
  } else if (folderTool.value == "edit") {
    console.log("editFolderForm.value", editFolderForm.value);
    let { code, data, msg } = await editFolderApi(editFolderForm.value);
    layer.msg(msg);
  }
  //   handleGetFolders()
  emit("getFolders");
}

function editFolder(item) {
  editFolderForm.value = item;
  showAddFolder.value = true;
  folderTool.value = "edit";
}

let showDelFolder = ref(false)
let delFolderId = ref('')
let delFolderName = ref('')
function delFolder(item) {
  showDelFolder.value = true;
  delFolderId.value = item._id;
  delFolderName.value = item.folderName;
  // console.log('delFolder item',item);
}

async function confirmDelFolder(){
  let {code,msg} = await delFolderApi(delFolderId.value)
  layer.msg(msg)
  if(code==200){
    emit("getFolders");
  }else{
    console.log('code',code);
    console.log('msg',msg);
  }
}

function onContextMenu(item, e) {
  // console.log('e.x',e.x);
  // console.log('e.y',e.y);
  //prevent the browser's default menu
  e.preventDefault();
  //shou our menu
  _this.$contextmenu({
    x: e.x,
    y: -e.y,
    zIndex: 10001,
    items: [
      {
        label: "编辑",
        onClick: () => {
          editFolder(item);
        },
      },
      {
        label: "删除",
        onClick: () => {
          delFolder(item);
        },
      },
    ],
  });
}

onMounted(() => {});
</script>

<template>
  <section class="folders">
    <div class="title u-flex u-row-between">
      <span>文件夹</span>
      <span class="add-folder" @click="addFolder">+</span>
    </div>
    <ul v-if="folderList.length > 0" class="folder-list">
      <li
        v-for="(item, index) in folderList"
        @contextmenu="onContextMenu(item, $event)"
        @click="folderClick(item, index)"
        class="folder u-flex u-row-between"
        :class="index == folderIndex ? 'active' : ''"
        :key="item._id"
      >
        <span class="u-flex-1">{{ item.folderName }}</span>
        <!-- <span @click="editFolder(item)" class="edit">编辑</span> -->
      </li>
    </ul>
    <div v-else class="tip">还没有文件夹,请先新增</div>

    <s3-layer
      v-model="showAddFolder"
      :btn="['确认']"
      :closeBtn="2"
      area="400px"
      :title="folderTool == 'add' ? '新增文件夹' : '编辑文件夹'"
      @yes="confirmAddFolder"
    >
      <div>
        <span style="margin-right: 8px">文件夹名称</span>
        <input
          v-if="folderTool == 'add'"
          type="text"
          v-model="addFolderForm.folderName"
          maxlength="10"
          placeholder="文件夹名称"
        />
        <input
          v-else
          type="text"
          v-model="editFolderForm.folderName"
          maxlength="10"
          placeholder="文件夹名称"
        />
      </div>
    </s3-layer>

    <s3-layer
    v-model="showDelFolder"
    :btn="['确认删除']"
    :closeBtn="2"
    area="400px"
    title="删除"
    @yes="confirmDelFolder"
  >
    <div>
      <span style="margin-right:8px">确认删除-将会删除<span style="color:red">{{delFolderName}}</span>文件夹下所有笔记！</span>
    </div>
  </s3-layer>

  </section>
</template>
<style lang="scss">
.folders {
  padding: 10px;
  overflow-y: auto;
  .add-folder {
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 30px;
    cursor: pointer;
    &:hover {
      background: #ddd;
    }
  }
  .folder-list {
    .folder {
      padding: 5px 10px;
      border-radius: 5px;
      cursor: pointer;
      .edit {
        display: none;
      }
      &:hover {
        background-color: #2a2d53;
        .edit {
          display: block;
        }
      }
      &.active {
        background-color: #484c85;
      }
    }
  }
}
</style>
