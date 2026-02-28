import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import { SettingsLayout } from "~/components/SettingsLayout";
import Popup from "~/components/Popup";
import AdminSettings from "~/views/settings/AdminSettings";

const AdminSettingsPage: NextPageWithLayout = () => {
  return (
    <>
      <SettingsLayout currentTab="admin">
        <AdminSettings />
        <Popup />
      </SettingsLayout>
    </>
  );
};

AdminSettingsPage.getLayout = (page) => getDashboardLayout(page);

export default AdminSettingsPage;
