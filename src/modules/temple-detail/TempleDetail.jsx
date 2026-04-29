import { changeTempleCover, destroyTemple, linkTemples, resetTempleCover } from "@src/api/chara.js";
import { chaosCube, refineCharacter } from "@src/api/magic.js";
import { buildOssUrl, getOssSignature, uploadToOss } from "@src/api/oss.js";
import { TempleLink } from "@src/components/TempleLink.jsx";
import { openAttackModal } from "@src/modules/attack/index.js";
import { openCharacterSearchModal } from "@src/modules/character-search/CharacterSearch.jsx";
import { openFisheyeModal } from "@src/modules/fisheye/index.js";
import { openGuidepostModal } from "@src/modules/guidepost/index.js";
import { openScratchCardModal } from "@src/modules/scratch-card/index.js";
import { openStarForcesModal } from "@src/modules/star-forces/index.js";
import { openStardustModal } from "@src/modules/stardust/index.js";
import { openTempleSearchModal } from "@src/modules/temple-search/index.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { formatNumber } from "@src/utils/format.js";
import { dataURLtoBlob, hashDataURL } from "@src/utils/image.js";
import { closeModal, openConfirmModal, openModal, openAlertModal } from "@src/utils/modalManager.js";
import { getLargeCover, normalizeAvatar } from "@src/utils/oos.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import { showError, showSuccess, showWarning } from "@src/utils/toastManager.jsx";
import { TempleActions } from "./components/TempleActions.jsx";
import { TempleImage } from "./components/TempleImage.jsx";
import { TempleInfo } from "./components/TempleInfo.jsx";
import { openTempleLineEditorModal } from "./components/TempleLineEditor.jsx";

/**
 * 圣殿详情组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {string} props.characterName - 角色名称
 * @param {boolean} props.imageOnly - 是否只显示图片
 */
export function TempleDetail({ temple, characterName, imageOnly = false }) {
  const container = (
    <div
      id="tg-temple-detail"
      data-character-id={temple.CharacterId}
      data-user-id={temple.UserId}
      data-name={temple.Name}
      className="tg-bg-content"
      style={{ width: "fit-content", minWidth: "320px", maxWidth: "600px" }}
    />
  );

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
      currentLine = temple.Line || "",
    } = state || {};

    // 修改封面
    const handleChangeCover = async () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!/image/.test(file.type)) {
          showWarning("请选择图片文件");
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
              showError(signatureResult.message || "获取签名失败");
              return;
            }

            // 上传到OSS
            const uploadResult = await uploadToOss(ossUrl, blob, signatureResult.data);
            if (!uploadResult.success) {
              showError(uploadResult.message || "上传失败");
              return;
            }

            // 更新圣殿封面
            const changeResult = await changeTempleCover(templeData.CharacterId, ossUrl);
            if (!changeResult.success) {
              showError(changeResult.message || "更换封面失败");
              return;
            }

            openAlertModal({ message: "更换封面成功" });
            setState({ imageUrl: getLargeCover(ossUrl) });
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("更换封面失败:", error);
          showError("更换封面失败");
        }
      };

      input.click();
    };

    // 重置封面
    const handleResetCover = () => {
      openConfirmModal({
        title: "重置封面",
        message: "确定要重置封面吗？",
        onConfirm: async () => {
          try {
            const result = await resetTempleCover(templeData.CharacterId, templeData.UserId);
            if (!result.success) {
              showError(result.message || "重置封面失败");
              return;
            }

            openAlertModal({ message: "重置封面成功" });
            const newImageUrl = result.data.Cover
              ? getLargeCover(result.data.Cover)
              : normalizeAvatar(templeData.Avatar);
            setState({ imageUrl: newImageUrl });
          } catch (error) {
            console.error("重置封面失败:", error);
            showError("重置封面失败");
          }
        },
      });
    };

    // 打开台词修改弹窗
    const handleChangeLine = () => {
      openTempleLineEditorModal({
        characterId: templeData.CharacterId,
        currentLine,
        onSuccess: (newLine) => {
          setState({
            currentLine: newLine,
          });
        },
      });
    };

    // 打开LINK搜索弹窗
    const handleLink = () => {
      openTempleSearchModal({
        title: "选择你想要「连接」的圣殿",
        username: getCurrentUsername(),
        onTempleClick: handleTempleSelect,
      });
    };

    // 精炼圣殿
    const handleRefine = () => {
      const cost = Math.pow(1.3, templeData.Refine) * 10000;

      openConfirmModal({
        title: "精炼圣殿",
        message: `确定要消耗1股固定资产和${formatNumber(cost, 0)}cc进行精炼？`,
        onConfirm: async () => {
          try {
            const result = await refineCharacter(templeData.CharacterId);
            if (!result.success) {
              showError(result.message);
              return;
            }

            openAlertModal({ message: result.data });

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
            showError("精炼失败");
          }
        },
      });
    };

    // 打开虚空道标搜索弹窗
    const openPostSearchModal = () => {
      openCharacterSearchModal({
        title: "选择「虚空道标」获取的目标",
        username: getCurrentUsername(),
        onCharacterClick: handlePostCharacterSelect,
      });
    };

    // 选择角色进行虚空道标
    const handlePostCharacterSelect = (character) => {
      openGuidepostModal({
        temple: templeData,
        character,
        onSuccess: () => {
          setState({
            templeData: {
              ...templeData,
              Assets: templeData.Assets - 100,
            },
          });
        },
      });
    };

    // 打开鲤鱼之眼搜索弹窗
    const openFisheyeSearchModal = () => {
      openCharacterSearchModal({
        title: "选择「鲤鱼之眼」获取的目标",
        username: getCurrentUsername(),
        onCharacterClick: handleFisheyeCharacterSelect,
      });
    };

    // 选择角色进行鲤鱼之眼
    const handleFisheyeCharacterSelect = (character) => {
      const searchModalId = `character-search-${getCurrentUsername()}`;

      openFisheyeModal({
        temple: templeData,
        character,
        onSuccess: () => {
          setState({
            templeData: {
              ...templeData,
              Assets: templeData.Assets - 100,
            },
          });
          closeModal(searchModalId);
        },
      });
    };

    // 打开星光碎片搜索弹窗
    const openStardustSearchModal = () => {
      openCharacterSearchModal({
        title: "选择「星光碎片」消耗的目标",
        username: getCurrentUsername(),
        onCharacterClick: handleStardustCharacterSelect,
      });
    };

    // 选择角色进行星光碎片
    const handleStardustCharacterSelect = (character) => {
      openStardustModal({
        temple: templeData,
        character,
      });
    };

    // 打开闪光结晶搜索弹窗
    const openAttackSearchModal = () => {
      const searchModalId = `character-search-${getCurrentUsername()}`;

      openCharacterSearchModal({
        title: "选择「闪光结晶」攻击的目标",
        username: getCurrentUsername(),
        onCharacterClick: (character) => {
          openAttackModal({
            temple: templeData,
            character,
            onSuccess: () => {
              setState({
                templeData: {
                  ...templeData,
                  Assets: templeData.Assets - 100,
                },
              });
            },
          });
        },
      });
    };

    // 打开星之力弹窗
    const handleStarForcesClick = () => {
      openStarForcesModal({
        temple: templeData,
        onSuccess: (amount) => {
          setState({
            templeData: {
              ...templeData,
              Assets: Math.max(0, templeData.Assets - amount),
            },
          });
        },
      });
    };

    // 打开混沌魔方弹窗
    const handleChaosCubeClick = () => {
      openConfirmModal({
        title: "混沌魔方",
        message: "确定消耗10点资产值使用1个「混沌魔方」？",
        onConfirm: async () => {
          try {
            const result = await chaosCube(templeData.CharacterId);
            if (!result.success) {
              showError(result.message);
              return;
            }

            const cardData = [result.data];

            setState({
              templeData: {
                ...templeData,
                Assets: templeData.Assets - 10,
              },
            });

            openScratchCardModal({
              charas: cardData,
              title: "混沌魔方",
            });
          } catch (error) {
            console.error("混沌魔方使用失败:", error);
            showError("混沌魔方使用失败");
          }
        },
      });
    };

    // 拆除圣殿
    const handleDestroy = () => {
      openConfirmModal({
        title: "拆除圣殿",
        message: "拆除操作不可逆，请谨慎确认，确定要拆除圣殿？",
        onConfirm: async () => {
          try {
            const result = await destroyTemple(templeData.CharacterId);
            if (!result.success) {
              showError(result.message);
              return;
            }

            openAlertModal({ message: result.data || "圣殿拆除成功" });
          } catch (error) {
            console.error("拆除圣殿失败:", error);
            showError("拆除圣殿失败");
          }
        },
      });
    };

    // 选择圣殿进行LINK
    const handleTempleSelect = (selectedTemple) => {
      const confirmModalId = `link-confirm-${templeData.CharacterId}-${selectedTemple.CharacterId}`;
      const searchModalId = `temple-search-${getCurrentUsername()}`;

      openModal(confirmModalId, {
        title: "确定「连接」的圣殿",
        content: (
          <div className="flex flex-col items-center gap-4">
            <TempleLink temple1={templeData} temple2={selectedTemple} sort={false} size="small" />
            <div className="flex w-full justify-end gap-2 p-1">
              <button className="btn btn-sm" onClick={() => closeModal(confirmModalId)}>
                取消
              </button>
              <button
                className="btn-bgm btn btn-sm"
                onClick={async () => {
                  try {
                    const result = await linkTemples(
                      templeData.CharacterId,
                      selectedTemple.CharacterId
                    );
                    if (!result.success) {
                      showError(result.message);
                      return;
                    }

                    closeModal(confirmModalId);
                    closeModal(searchModalId);
                    showSuccess(result.data);
                  } catch (error) {
                    console.error("链接失败:", error);
                    showError("链接失败");
                  }
                }}
              >
                确定
              </button>
            </div>
          </div>
        ),
        size: "sm",
      });
    };

    // 获取当前用户名
    const getCurrentUsername = () => {
      const userAssets = getCachedUserAssets();
      return userAssets?.name || "";
    };

    return (
      <div className="flex flex-col">
        <TempleImage
          imageUrl={imageUrl}
          characterName={characterName}
          line={currentLine}
          onImageLoad={(width) => {
            // 设置父容器宽度为图片宽度
            if (width > 0) {
              container.style.width = `${width}px`;
              container.style.maxWidth = "100%";
            }
          }}
        />
        {!imageOnly && (
          <div style={{ maxWidth: "100%", overflow: "hidden" }}>
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
              onStarForces={handleStarForcesClick}
              onChaosCube={handleChaosCubeClick}
              onDestroy={handleDestroy}
            />
          </div>
        )}
      </div>
    );
  });

  // 触发初始渲染
  setState({
    templeData: temple,
    imageUrl: temple.Cover ? getLargeCover(temple.Cover) : normalizeAvatar(temple.Avatar),
    currentLine: temple.Line || "",
  });

  return container;
}

/**
 * 打开圣殿详情弹窗
 * @param {Object} params
 * @param {Object} params.temple - 圣殿对象
 * @param {string} params.characterName - 角色名称
 * @param {boolean} params.imageOnly - 是否只显示图片
 * @param {Function} params.onClose - 关闭回调
 */
export function openTempleModal({ temple, characterName = "", imageOnly = false, onClose }) {
  openModal(`temple-${temple.Id}`, {
    content: (
      <TempleDetail
        temple={{ ...temple, Name: characterName }}
        characterName={characterName}
        imageOnly={imageOnly}
      />
    ),
    borderless: true,
    showCloseButton: true,
    position: "middle",
    onClose,
    size: "fit",
  });
}
