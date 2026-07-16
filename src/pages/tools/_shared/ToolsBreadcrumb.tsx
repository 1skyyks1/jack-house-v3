import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type ToolsBreadcrumbProps = {
  current?: string
}

export function ToolsBreadcrumb({ current }: ToolsBreadcrumbProps) {
  const { t } = useTranslation()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {current ? (
            <BreadcrumbLink asChild><Link to="/tool">{t("tools.title")}</Link></BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{t("tools.title")}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {current ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{current}</BreadcrumbPage></BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
