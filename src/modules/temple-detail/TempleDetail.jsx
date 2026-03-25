import { Fragment } from "@src/utils/jsx-dom.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { TempleImage } from "./components/TempleImage.jsx";
import { TempleInfo } from "./components/TempleInfo.jsx";
import { TempleActions } from "./components/TempleActions.jsx";
import { TempleLineEditor } from "./components/TempleLineEditor.jsx";
import { getLargeCover, normalizeAvatar } from "@src/utils/oos.js";
import { hashDataURL, dataURLtoBlob } from "@src/utils/image.js";
import { getOssSignature, uploadToOss, buildOssUrl } from "@src/api/oss.js";
import {
  changeTempleCover,
  resetTempleCover,
  changeTempleLine,
  linkTemples,
  destroyTemple,
} from "@src/api/chara.js";
import { refineCharacter, starbreak, chaosCube } from "@src/api/magic.js";
import { Modal, closeModalById } from "@src/components/Modal.jsx";
import { Button } from "@src/components/Button.jsx";
import { TempleSearch } from "@src/modules/temple-search/TempleSearch.jsx";
import { TempleLink } from "@src/components/TempleLink.jsx";
import { CharacterSearch } from "@src/modules/character-search/CharacterSearch.jsx";
import { Guidepost } from "@src/modules/guidepost/Guidepost.jsx";
import { Fisheye } from "@src/modules/fisheye/Fisheye.jsx";
import { Stardust } from "@src/modules/stardust/Stardust.jsx";
import { Attack } from "@src/modules/attack/Attack.jsx";
import { StarForces } from "@src/modules/star-forces/StarForces.jsx";
import { ScratchCard } from "@src/modules/scratch-card/ScratchCard.jsx";
import { formatNumber } from "@src/utils/format.js";

/**
 * 圣殿详情组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {string} props.characterName - 角色名称
 * @param {boolean} props.imageOnly - 是否只显示图片
 */
export function TempleDetail({ temple, characterName, imageOnly = false }) {
  const minWidth = 480;
  const container = (
    <div
      id="tg-temple-detail"
      data-character-id={temple.CharacterId}
      data-user-id={temple.UserId}
      data-name={temple.Name}
      className="tg-bg-content"
      style={{ width: `${minWidth}px` }}
    />
  );

  // 存储Modal生成的ID
  let generatedLineModalId = null;
  let generatedLinkModalId = null;
  let generatedLinkConfirmModalId = null;
  let generatedPostModalId = null;
  let generatedPostConfirmModalId = null;
  let generatedFisheyeModalId = null;
  let generatedFisheyeConfirmModalId = null;
  let generatedStardustModalId = null;
  let generatedStardustConfirmModalId = null;
  let generatedAttackModalId = null;
  let generatedAttackConfirmModalId = null;
  let generatedStarForcesModalId = null;
  let generatedChaosCubeModalId = null;

  // 防止图片加载时重复更新宽度
  let hasSetWidth = false;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  const { setState, render } = createMountedComponent(container, (state) => {
    const {
      templeData = temple,
      imageUrl = temple.Cover ? getLargeCover(temple.Cover) : normalizeAvatar(temple.Avatar),
      containerWidth = minWidth,
      showLineModal = false,
      showLinkModal = false,
      showLinkConfirmModal = false,
      showPostModal = false,
      showPostConfirmModal = false,
      showFisheyeModal = false,
      showFisheyeConfirmModal = false,
      showStardustModal = false,
      showStardustConfirmModal = false,
      showAttackModal = false,
      showAttackConfirmModal = false,
      showStarForcesModal = false,
      showChaosCubeModal = false,
      currentLine = temple.Line || "",
      selectedTemple = null,
      selectedPostCharacter = null,
      selectedFisheyeCharacter = null,
      selectedStardustCharacter = null,
      selectedAttackCharacter = null,
      chaosCubeData = [],
    } = state || {};

    // 更新容器宽度
    container.style.width = `${containerWidth}px`;
    container.style.maxWidth = "100%";

    // 图片加载完成回调
    const handleImageLoad = (width) => {
      if (!hasSetWidth && width !== minWidth) {
        hasSetWidth = true;
        setState({ containerWidth: width });
      }
    };

    // 修改封面
    const handleChangeCover = async () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!/image/.test(file.type)) {
          alert("请选择图片文件");
          return;
        }

        try {
          // 读取文件
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const dataUrl = ev.target.result;

            // 计算hash和转换为blob
            const hash = await hashDataURL(dataUrl);
            const blob = dataURLtoBlob(dataUrl);

            // 构建OSS URL
            const ossUrl = buildOssUrl("cover", hash, "jpg");

            // 获取OSS签名
            const signatureResult = await getOssSignature(
              "cover",
              hash,
              encodeURIComponent(file.type)
            );
            if (!signatureResult.success) {
              alert(signatureResult.message || "获取签名失败");
              return;
            }

            // 上传到OSS
            const uploadResult = await uploadToOss(ossUrl, blob, signatureResult.data);
            if (!uploadResult.success) {
              alert(uploadResult.message || "上传失败");
              return;
            }

            // 更新圣殿封面
            const changeResult = await changeTempleCover(templeData.CharacterId, ossUrl);
            if (!changeResult.success) {
              alert(changeResult.message || "更换封面失败");
              return;
            }

            alert("更换封面成功");
            setState({ imageUrl: dataUrl });
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("更换封面失败:", error);
          alert("更换封面失败");
        }
      };

      input.click();
    };

    // 重置封面
    const handleResetCover = async () => {
      if (!confirm("确定要重置封面吗？")) {
        return;
      }

      try {
        const result = await resetTempleCover(templeData.CharacterId, templeData.UserId);
        if (!result.success) {
          alert(result.message || "重置封面失败");
          return;
        }

        alert("重置封面成功");
        const newImageUrl = result.data.Cover
          ? getLargeCover(result.data.Cover)
          : normalizeAvatar(templeData.Avatar);
        setState({ imageUrl: newImageUrl });
      } catch (error) {
        console.error("重置封面失败:", error);
        alert("重置封面失败");
      }
    };

    // 打开台词修改弹窗
    const handleChangeLine = () => {
      setState({ showLineModal: true });
    };

    // 关闭台词修改弹窗
    const closeLineModal = () => {
      closeModalById(generatedLineModalId);
      setState({ showLineModal: false });
    };

    // 提交台词修改
    const handleLineSubmit = async (newLine) => {
      const trimmedLine = newLine.trim();

      try {
        const result = await changeTempleLine(templeData.CharacterId, trimmedLine);
        if (!result.success) {
          alert(result.message || "修改台词失败");
          return;
        }

        alert(result.Value || "修改台词成功");
        closeLineModal();
        setState({
          currentLine: trimmedLine,
        });
      } catch (error) {
        console.error("修改台词失败:", error);
        alert("修改台词失败");
      }
    };

    // 打开LINK搜索弹窗
    const handleLink = () => {
      setState({ showLinkModal: true });
    };

    // 关闭LINK搜索弹窗
    const closeLinkModal = () => {
      closeModalById(generatedLinkModalId);
      setState({ showLinkModal: false });
    };

    // 精炼圣殿
    const handleRefine = async () => {
      const cost = Math.pow(1.3, templeData.Refine) * 10000;

      if (!confirm(`确定要消耗1股固定资产和${formatNumber(cost, 0)}cc进行精炼？`)) {
        return;
      }

      try {
        const result = await refineCharacter(templeData.CharacterId);
        if (!result.success) {
          alert(result.message);
          return;
        }

        alert(result.data);

        // 根据结果更新temple对象
        if (result.data.indexOf("成功") !== -1) {
          setState({
            templeData: {
              ...templeData,
              Refine: templeData.Refine + 1,
              Assets: templeData.Assets - 1,
            },
          });
        } else if (result.data.indexOf("失败") !== -1) {
          setState({
            templeData: {
              ...templeData,
              Refine: 0,
              Assets: templeData.Assets - 1,
            },
          });
        }
      } catch (error) {
        console.error("精炼失败:", error);
        alert("精炼失败");
      }
    };

    // 打开虚空道标搜索弹窗
    const openPostSearchModal = () => {
      setState({ showPostModal: true });
    };

    // 关闭虚空道标搜索弹窗
    const closePostSearchModal = () => {
      closeModalById(generatedPostModalId);
      setState({ showPostModal: false });
    };

    // 选择角色进行虚空道标
    const handlePostCharacterSelect = (character) => {
      setState({
        selectedPostCharacter: character,
        showPostConfirmModal: true,
      });
    };

    // 关闭虚空道标确认弹窗
    const closePostConfirmModal = () => {
      closeModalById(generatedPostConfirmModalId);
      setState({ showPostConfirmModal: false });
    };

    // 打开鲤鱼之眼搜索弹窗
    const openFisheyeSearchModal = () => {
      setState({ showFisheyeModal: true });
    };

    // 关闭鲤鱼之眼搜索弹窗
    const closeFisheyeSearchModal = () => {
      closeModalById(generatedFisheyeModalId);
      setState({ showFisheyeModal: false });
    };

    // 选择角色进行鲤鱼之眼
    const handleFisheyeCharacterSelect = (character) => {
      setState({
        selectedFisheyeCharacter: character,
        showFisheyeConfirmModal: true,
      });
    };

    // 关闭鲤鱼之眼确认弹窗
    const closeFisheyeConfirmModal = () => {
      closeModalById(generatedFisheyeConfirmModalId);
      setState({ showFisheyeConfirmModal: false });
    };

    // 打开星光碎片搜索弹窗
    const openStardustSearchModal = () => {
      setState({ showStardustModal: true });
    };

    // 关闭星光碎片搜索弹窗
    const closeStardustSearchModal = () => {
      closeModalById(generatedStardustModalId);
      setState({ showStardustModal: false });
    };

    // 选择角色进行星光碎片
    const handleStardustCharacterSelect = (character) => {
      setState({
        selectedStardustCharacter: character,
        showStardustConfirmModal: true,
      });
    };

    // 关闭星光碎片确认弹窗
    const closeStardustConfirmModal = () => {
      closeModalById(generatedStardustConfirmModalId);
      setState({ showStardustConfirmModal: false });
    };

    // 打开闪光结晶搜索弹窗
    const openAttackSearchModal = () => {
      setState({ showAttackModal: true });
    };

    // 关闭闪光结晶搜索弹窗
    const closeAttackSearchModal = () => {
      closeModalById(generatedAttackModalId);
      setState({ showAttackModal: false });
    };

    // 选择角色进行闪光结晶
    const handleAttackCharacterSelect = (character) => {
      setState({
        selectedAttackCharacter: character,
        showAttackConfirmModal: true,
      });
    };

    // 关闭闪光结晶确认弹窗
    const closeAttackConfirmModal = () => {
      closeModalById(generatedAttackConfirmModalId);
      setState({ showAttackConfirmModal: false });
    };

    // 打开星之力弹窗
    const openStarForcesModal = () => {
      setState({ showStarForcesModal: true });
    };

    // 关闭星之力弹窗
    const closeStarForcesModal = () => {
      closeModalById(generatedStarForcesModalId);
      setState({ showStarForcesModal: false });
    };

    // 打开混沌魔方弹窗
    const openChaosCubeModal = async () => {
      if (!confirm("确定消耗10点资产值使用1个「混沌魔方」？")) {
        return;
      }

      try {
        const result = await chaosCube(templeData.CharacterId);
        if (!result.success) {
          alert(result.message);
          return;
        }

        const cardData = [result.data];

        setState({
          templeData: {
            ...templeData,
            Assets: templeData.Assets - 10,
          },
          chaosCubeData: cardData,
          showChaosCubeModal: true,
        });
      } catch (error) {
        console.error("混沌魔方使用失败:", error);
        alert("混沌魔方使用失败");
      }
    };

    // 关闭混沌魔方弹窗
    const closeChaosCubeModal = () => {
      closeModalById(generatedChaosCubeModalId);
      setState({ showChaosCubeModal: false });
    };

    // 拆除圣殿
    const handleDestroy = async () => {
      if (!confirm("拆除操作不可逆，请谨慎确认，确定要拆除圣殿？")) {
        return;
      }

      try {
        const result = await destroyTemple(templeData.CharacterId);
        if (!result.success) {
          alert(result.message);
          return;
        }

        alert(result.data || "圣殿拆除成功");
      } catch (error) {
        console.error("拆除圣殿失败:", error);
        alert("拆除圣殿失败");
      }
    };

    // 选择圣殿进行LINK
    const handleTempleSelect = (selectedTemple) => {
      setState({
        selectedTemple,
        showLinkConfirmModal: true,
      });
    };

    // 关闭LINK确认弹窗
    const closeLinkConfirmModal = () => {
      closeModalById(generatedLinkConfirmModalId);
      setState({ showLinkConfirmModal: false });
    };

    // 确认LINK
    const handleConfirmLink = async () => {
      if (!selectedTemple) return;

      try {
        const result = await linkTemples(templeData.CharacterId, selectedTemple.CharacterId);
        if (!result.success) {
          alert(result.message);
          return;
        }

        alert(result.data);
        closeLinkConfirmModal();
        closeLinkModal();
      } catch (error) {
        console.error("链接失败:", error);
        alert("链接失败");
      }
    };

    // 获取当前用户名
    const getCurrentUsername = () => {
      try {
        const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
        if (cachedUserAssets) {
          const userAssets = JSON.parse(cachedUserAssets);
          return userAssets.name || "";
        }
      } catch (e) {
        console.warn("读取用户资产缓存失败:", e);
      }
      return "";
    };

    return (
      <>
        <TempleImage
          imageUrl={imageUrl}
          characterName={characterName}
          line={currentLine}
          onLoad={handleImageLoad}
        />
        {!imageOnly && (
          <>
            <TempleInfo templeData={templeData} />
            <TempleActions
              temple={templeData}
              onChangeCover={handleChangeCover}
              onResetCover={handleResetCover}
              onChangeLine={handleChangeLine}
              onLink={handleLink}
              onRefine={handleRefine}
              onPost={openPostSearchModal}
              onFisheye={openFisheyeSearchModal}
              onStardust={openStardustSearchModal}
              onAttack={openAttackSearchModal}
              onStarForces={openStarForcesModal}
              onChaosCube={openChaosCubeModal}
              onDestroy={handleDestroy}
            />
          </>
        )}
        {showLineModal && !isModalExist(generatedLineModalId) && (
          <Modal
            visible={showLineModal}
            onClose={closeLineModal}
            title="修改台词"
            position="center"
            maxWidth={640}
            modalId={generatedLineModalId}
            getModalId={(id) => {
              generatedLineModalId = id;
            }}
          >
            <TempleLineEditor
              currentLine={currentLine}
              onSubmit={handleLineSubmit}
              onCancel={closeLineModal}
            />
          </Modal>
        )}
        {showLinkModal && !isModalExist(generatedLinkModalId) && (
          <Modal
            visible={showLinkModal}
            onClose={closeLinkModal}
            title="选择你想要「连接」的圣殿"
            modalId={generatedLinkModalId}
            getModalId={(id) => {
              generatedLinkModalId = id;
            }}
          >
            <TempleSearch username={getCurrentUsername()} onTempleClick={handleTempleSelect} />
          </Modal>
        )}
        {showLinkConfirmModal && !isModalExist(generatedLinkConfirmModalId) && (
          <Modal
            visible={showLinkConfirmModal}
            onClose={closeLinkConfirmModal}
            title="确定「连接」的圣殿"
            position="center"
            maxWidth={240}
            modalId={generatedLinkConfirmModalId}
            getModalId={(id) => {
              generatedLinkConfirmModalId = id;
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <TempleLink temple1={templeData} temple2={selectedTemple} sort={false} size="small" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeLinkConfirmModal}>
                  取消
                </Button>
                <Button variant="solid" onClick={handleConfirmLink}>
                  确定
                </Button>
              </div>
            </div>
          </Modal>
        )}
        {showPostModal && !isModalExist(generatedPostModalId) && (
          <Modal
            visible={showPostModal}
            onClose={closePostSearchModal}
            title="选择「虚空道标」获取的目标"
            modalId={generatedPostModalId}
            maxWidth={640}
            getModalId={(id) => {
              generatedPostModalId = id;
            }}
          >
            <CharacterSearch
              username={getCurrentUsername()}
              onCharacterClick={handlePostCharacterSelect}
            />
          </Modal>
        )}
        {showPostConfirmModal && !isModalExist(generatedPostConfirmModalId) && (
          <Modal
            visible={showPostConfirmModal}
            onClose={closePostConfirmModal}
            title="确定「虚空道标」获取的目标"
            position="center"
            maxWidth={480}
            modalId={generatedPostConfirmModalId}
            getModalId={(id) => {
              generatedPostConfirmModalId = id;
            }}
          >
            <Guidepost
              temple={templeData}
              character={selectedPostCharacter}
              onSuccess={() => {
                setState({
                  templeData: {
                    ...templeData,
                    Assets: templeData.Assets - 100,
                  },
                });
                closePostConfirmModal();
              }}
            />
          </Modal>
        )}
        {showFisheyeModal && !isModalExist(generatedFisheyeModalId) && (
          <Modal
            visible={showFisheyeModal}
            onClose={closeFisheyeSearchModal}
            title="选择「鲤鱼之眼」获取的目标"
            modalId={generatedFisheyeModalId}
            maxWidth={640}
            getModalId={(id) => {
              generatedFisheyeModalId = id;
            }}
          >
            <CharacterSearch
              username={getCurrentUsername()}
              onCharacterClick={handleFisheyeCharacterSelect}
            />
          </Modal>
        )}
        {showFisheyeConfirmModal && !isModalExist(generatedFisheyeConfirmModalId) && (
          <Modal
            visible={showFisheyeConfirmModal}
            onClose={closeFisheyeConfirmModal}
            title="确定「鲤鱼之眼」获取的目标"
            position="center"
            maxWidth={480}
            modalId={generatedFisheyeConfirmModalId}
            getModalId={(id) => {
              generatedFisheyeConfirmModalId = id;
            }}
          >
            <Fisheye
              temple={templeData}
              character={selectedFisheyeCharacter}
              onSuccess={() => {
                setState({
                  templeData: {
                    ...templeData,
                    Assets: templeData.Assets - 100,
                  },
                });
                closeFisheyeConfirmModal();
                closeFisheyeSearchModal();
              }}
            />
          </Modal>
        )}
        {showStardustModal && !isModalExist(generatedStardustModalId) && (
          <Modal
            visible={showStardustModal}
            onClose={closeStardustSearchModal}
            title="选择「星光碎片」消耗的目标"
            modalId={generatedStardustModalId}
            maxWidth={640}
            getModalId={(id) => {
              generatedStardustModalId = id;
            }}
          >
            <CharacterSearch
              username={getCurrentUsername()}
              onCharacterClick={handleStardustCharacterSelect}
            />
          </Modal>
        )}
        {showStardustConfirmModal && !isModalExist(generatedStardustConfirmModalId) && (
          <Modal
            visible={showStardustConfirmModal}
            onClose={closeStardustConfirmModal}
            title="确定「星光碎片」消耗的目标"
            position="center"
            maxWidth={480}
            modalId={generatedStardustConfirmModalId}
            getModalId={(id) => {
              generatedStardustConfirmModalId = id;
            }}
          >
            <Stardust
              temple={templeData}
              character={selectedStardustCharacter}
              onSuccess={() => {
                closeStardustConfirmModal();
                closeStardustSearchModal();
              }}
            />
          </Modal>
        )}
        {showAttackModal && !isModalExist(generatedAttackModalId) && (
          <Modal
            visible={showAttackModal}
            onClose={closeAttackSearchModal}
            title="选择「闪光结晶」攻击的目标"
            modalId={generatedAttackModalId}
            maxWidth={640}
            getModalId={(id) => {
              generatedAttackModalId = id;
            }}
          >
            <CharacterSearch
              username={getCurrentUsername()}
              onCharacterClick={handleAttackCharacterSelect}
            />
          </Modal>
        )}
        {showAttackConfirmModal && !isModalExist(generatedAttackConfirmModalId) && (
          <Modal
            visible={showAttackConfirmModal}
            onClose={closeAttackConfirmModal}
            title="确定「闪光结晶」攻击的目标"
            position="center"
            maxWidth={480}
            modalId={generatedAttackConfirmModalId}
            getModalId={(id) => {
              generatedAttackConfirmModalId = id;
            }}
          >
            <Attack
              temple={templeData}
              character={selectedAttackCharacter}
              onSuccess={() => {
                setState({
                  templeData: {
                    ...templeData,
                    Assets: templeData.Assets - 100,
                  },
                });
                closeAttackConfirmModal();
                closeAttackSearchModal();
              }}
            />
          </Modal>
        )}
        {showStarForcesModal && !isModalExist(generatedStarForcesModalId) && (
          <Modal
            visible={showStarForcesModal}
            onClose={closeStarForcesModal}
            title="转化星之力"
            position="center"
            maxWidth={400}
            modalId={generatedStarForcesModalId}
            getModalId={(id) => {
              generatedStarForcesModalId = id;
            }}
          >
            <StarForces
              temple={templeData}
              onSuccess={(amount) => {
                setState({
                  templeData: {
                    ...templeData,
                    Assets: Math.max(0, templeData.Assets - amount),
                  },
                });
                closeStarForcesModal();
              }}
            />
          </Modal>
        )}
        {showChaosCubeModal && !isModalExist(generatedChaosCubeModalId) && (
          <Modal
            visible={showChaosCubeModal}
            onClose={closeChaosCubeModal}
            title="混沌魔方"
            maxWidth={640}
            modalId={generatedChaosCubeModalId}
            getModalId={(id) => {
              generatedChaosCubeModalId = id;
            }}
          >
            <ScratchCard charas={chaosCubeData} />
          </Modal>
        )}
      </>
    );
  });

  // 触发初始渲染
  setState({
    templeData: temple,
    imageUrl: temple.Cover ? getLargeCover(temple.Cover) : normalizeAvatar(temple.Avatar),
    containerWidth: minWidth,
    currentLine: temple.Line || "",
  });

  return container;
}
