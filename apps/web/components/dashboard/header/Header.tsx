import Link from "next/link";
import { redirect } from "next/navigation";
import GlobalActions from "@/components/dashboard/GlobalActions";
import ProfileOptions from "@/components/dashboard/header/ProfileOptions";
import { SearchInput } from "@/components/dashboard/search/SearchInput";
import KarakeepLogo from "@/components/KarakeepIcon";
import { SidebarCollapseToggle } from "@/components/shared/sidebar/SidebarShell";
import { getServerAuthSession } from "@/server/auth";

export default async function Header() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  return (
    <header className="sticky left-0 right-0 top-0 z-50 flex h-16 items-center justify-between overflow-x-auto overflow-y-hidden bg-background p-4 shadow">
      <div className="hidden shrink-0 items-center sm:flex">
        <Link href={"/dashboard/bookmarks"} className="w-56">
          <KarakeepLogo height={38} />
        </Link>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <div className="hidden shrink-0 sm:flex sm:items-center">
          <SidebarCollapseToggle />
        </div>
        <SearchInput className="rounded-md bg-muted" />
        <GlobalActions />
      </div>
      <div className="flex items-center">
        <ProfileOptions />
      </div>
    </header>
  );
}
