import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { Draggable } from "react-beautiful-dnd";
import { useForm } from "react-hook-form";
import {
  HiEllipsisHorizontal,
  HiOutlinePlusSmall,
  HiOutlineSquaresPlus,
  HiOutlineTrash,
} from "react-icons/hi2";

import { authClient } from "@kan/auth/client";

import Dropdown from "~/components/Dropdown";
import { Tooltip } from "~/components/Tooltip";
import { usePermissions } from "~/hooks/usePermissions";
import { useModal } from "~/providers/modal";
import { api } from "~/utils/api";

interface ListProps {
  children: ReactNode;
  index: number;
  list: List;
  setSelectedPublicListId: (publicListId: PublicListId) => void;
}

interface List {
  publicId: string;
  name: string;
  createdBy?: string | null;
  minimumRole?: string;
  emailAssigneesOnMove?: boolean;
  emailLeadersOnMove?: boolean;
}

interface FormValues {
  listPublicId: string;
  name: string;
}

type PublicListId = string;

export default function List({
  children,
  index,
  list,
  setSelectedPublicListId,
}: ListProps) {
  const { openModal } = useModal();
  const { canCreateCard, canEditList, canDeleteList, role, isGlobalAdmin } = usePermissions();
  const { data: session } = authClient.useSession();
  const isCreator = list.createdBy && session?.user.id === list.createdBy;
  const canEdit = canEditList || isCreator;
  const canDrag = canEditList || isCreator;
  const canSetMinimumRole = isGlobalAdmin || role === "admin" || role === "leader";

  const openNewCardForm = (publicListId: PublicListId) => {
    if (!canCreateCard) return;
    openModal("NEW_CARD");
    setSelectedPublicListId(publicListId);
  };

  const updateList = api.list.update.useMutation();

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      listPublicId: list.publicId,
      name: list.name,
    },
    values: {
      listPublicId: list.publicId,
      name: list.name,
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!canEdit) return;
    updateList.mutate({
      listPublicId: values.listPublicId,
      name: values.name,
    });
  };

  const handleOpenDeleteListConfirmation = () => {
    setSelectedPublicListId(list.publicId);
    openModal("DELETE_LIST");
  };

  const handleMinimumRoleChange = (newRole: "leader" | "member" | "guest") => {
    updateList.mutate({
      listPublicId: list.publicId,
      minimumRole: newRole,
    });
  };

  const handleEmailAssigneesToggle = () => {
    updateList.mutate({
      listPublicId: list.publicId,
      emailAssigneesOnMove: !list.emailAssigneesOnMove,
    });
  };

  const handleEmailLeadersToggle = () => {
    updateList.mutate({
      listPublicId: list.publicId,
      emailLeadersOnMove: !list.emailLeadersOnMove,
    });
  };

  return (
    <Draggable
      key={list.publicId}
      draggableId={list.publicId}
      index={index}
      isDragDisabled={!canDrag}
    >
      {(provided) => (
        <div
          key={list.publicId}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="dark-text-dark-1000 mr-5 h-fit min-w-[18rem] max-w-[18rem] rounded-md border border-light-400 bg-light-300 py-2 pl-2 pr-1 text-neutral-900 dark:border-dark-300 dark:bg-dark-100"
        >
          <div className="mb-2 flex justify-between">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full focus-visible:outline-none"
            >
              <input
                id="name"
                type="text"
                {...register("name")}
                onBlur={handleSubmit(onSubmit)}
                readOnly={!canEdit}
                className="w-full border-0 bg-transparent px-4 pt-1 text-sm font-medium text-neutral-900 focus:ring-0 focus-visible:outline-none dark:text-dark-1000"
              />
            </form>
            <div className="flex items-center">
              <Tooltip
                content={
                  !canCreateCard ? t`You don't have permission` : undefined
                }
              >
                <button
                  className="mx-1 inline-flex h-fit items-center rounded-md p-1 px-1 text-sm font-semibold text-dark-50 hover:bg-light-400 disabled:opacity-60 disabled:cursor-not-allowed dark:hover:bg-dark-200"
                  onClick={() => openNewCardForm(list.publicId)}
                  disabled={!canCreateCard}
                >
                  <HiOutlinePlusSmall
                    className="h-5 w-5 text-dark-900"
                    aria-hidden="true"
                  />
                </button>
              </Tooltip>
              {(() => {
                const dropdownItems = [
                  ...(canCreateCard
                    ? [
                        {
                          label: t`Add a card`,
                          action: () => openNewCardForm(list.publicId),
                          icon: (
                            <HiOutlineSquaresPlus className="h-[18px] w-[18px] text-dark-900" />
                          ),
                        },
                      ]
                    : []),
                  ...(canDeleteList || isCreator
                    ? [
                        {
                          label: t`Delete list`,
                          action: handleOpenDeleteListConfirmation,
                          icon: (
                            <HiOutlineTrash className="h-[18px] w-[18px] text-dark-900" />
                          ),
                        },
                      ]
                    : []),
                ];

                if (dropdownItems.length === 0) {
                  return null;
                }

                return (
                  <div className="relative mr-1 inline-block">
                    <Dropdown items={dropdownItems}>
                      <HiEllipsisHorizontal className="h-5 w-5 text-dark-900" />
                    </Dropdown>
                  </div>
                );
              })()}
            </div>
          </div>
          {canSetMinimumRole && (
            <div className="mb-2 flex flex-col gap-1 px-4">
              <div className="flex items-center">
                <label className="mr-2 text-[10px] text-light-900 dark:text-dark-800">
                  {t`Min role`}:
                </label>
                <select
                  value={list.minimumRole ?? "member"}
                  onChange={(e) =>
                    handleMinimumRoleChange(
                      e.target.value as "leader" | "member" | "guest",
                    )
                  }
                  className="h-5 rounded border border-light-500 bg-transparent px-1 py-0 text-[10px] text-light-900 focus:outline-none focus:ring-0 dark:border-dark-500 dark:text-dark-800"
                >
                  <option value="leader">{t`Leader`}</option>
                  <option value="member">{t`Member`}</option>
                  <option value="guest">{t`Guest`}</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-light-900 dark:text-dark-800">
                <input
                  type="checkbox"
                  checked={list.emailAssigneesOnMove ?? false}
                  onChange={handleEmailAssigneesToggle}
                  className="h-3 w-3 rounded border-light-500 dark:border-dark-500"
                />
                {t`Email assignees on card move`}
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-light-900 dark:text-dark-800">
                <input
                  type="checkbox"
                  checked={list.emailLeadersOnMove ?? false}
                  onChange={handleEmailLeadersToggle}
                  className="h-3 w-3 rounded border-light-500 dark:border-dark-500"
                />
                {t`Email leaders on card move`}
              </label>
            </div>
          )}
          {children}
        </div>
      )}
    </Draggable>
  );
}
