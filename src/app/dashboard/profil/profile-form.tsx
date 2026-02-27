"use client"

import { useState } from "react"
import { updateUserPassword, updateUserProfile, updateUserImage } from "@/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoaderCircleIcon, CheckCircle2Icon, AlertCircleIcon, CameraIcon } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export function ProfileForm({ user }: { user: any }) {
    const { update } = useSession()
    const [loading, setLoading] = useState(false)
    const [profileLoading, setProfileLoading] = useState(false)
    const [imageLoading, setImageLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("L'image est trop lourde (max 2Mo)")
            return
        }

        setImageLoading(true)
        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64String = reader.result as string
            try {
                const result = await updateUserImage(base64String)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Photo mise à jour !")
                    // Trigger a session refresh without sending the large image data
                    await update({ t: Date.now() })
                }
            } catch (error) {
                toast.error("Erreur lors de l'envoi de l'image")
            } finally {
                setImageLoading(false)
            }
        }
        reader.readAsDataURL(file)
    }

    async function handleUpdateProfile(formData: FormData) {
        setProfileLoading(true)
        setProfileMessage(null)
        try {
            const result = await updateUserProfile(formData)
            if (result.error) {
                setProfileMessage({ type: "error", text: result.error })
                toast.error(result.error)
            } else if (result.success) {
                setProfileMessage({ type: "success", text: result.success })
                toast.success(result.success)
            }
        } catch (error) {
            setProfileMessage({ type: "error", text: "Une erreur inattendue s'est produite." })
            toast.error("Une erreur inattendue s'est produite lors de la mise à jour du profil.")
        } finally {
            setProfileLoading(false)
        }
    }

    async function handleUpdatePassword(formData: FormData) {
        setLoading(true)
        setMessage(null)

        try {
            const result = await updateUserPassword(formData)

            if (result.error) {
                setMessage({ type: "error", text: result.error })
                toast.error(result.error)
            } else if (result.success) {
                setMessage({ type: "success", text: result.success })
                toast.success(result.success)
                const formElement = document.getElementById("profile-form") as HTMLFormElement
                if (formElement) formElement.reset()
            }
        } catch (error) {
            setMessage({ type: "error", text: "Une erreur inattendue s'est produite." })
            toast.error("Une erreur inattendue s'est produite lors du changement de mot de passe.")
        } finally {
            setLoading(false)
        }
    }

    // Format birthDate for input[type="date"] (YYYY-MM-DD)
    const birthDateValue = user?.birthDate
        ? new Date(user.birthDate).toISOString().split('T')[0]
        : "";

    return (
        <div className="space-y-8">
            {/* Profile Picture Card */}
            <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary overflow-hidden">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                        <div className="relative group">
                            <div className="size-24 rounded-full border-4 border-muted overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                {imageLoading ? (
                                    <LoaderCircleIcon className="animate-spin text-muted-foreground" size={32} />
                                ) : user?.image || (user as any)?.avatar ? (
                                    <img src={user?.image || (user as any)?.avatar} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <span>{user?.firstName?.charAt(0) || user?.email?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <label
                                htmlFor="image-upload"
                                className="absolute bottom-0 right-0 size-8 bg-secondary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-secondary/90 transition-colors shadow-lg"
                            >
                                <CameraIcon size={16} />
                                <input
                                    id="image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={imageLoading}
                                />
                            </label>
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-foreground">Photo de profil</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Cliquez sur l'icône appareil photo pour mettre à jour votre photo. Format JPG, PNG ou GIF. Max 2Mo.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Info Card */}
            <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
                <CardHeader className="pb-3 border-b border-border mb-5">
                    <CardTitle className="text-lg text-secondary">Informations Personnelles</CardTitle>
                    <CardDescription>
                        Mettez à jour vos coordonnées et informations de base.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleUpdateProfile} className="space-y-4">
                        {profileMessage && (
                            <div className={`p-4 text-sm rounded-lg flex items-center gap-2 ${profileMessage.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                {profileMessage.type === "success" ? <CheckCircle2Icon size={16} /> : <AlertCircleIcon size={16} />}
                                {profileMessage.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom <span className="text-red-500">*</span></Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    defaultValue={user?.firstName || ""}
                                    required
                                    readOnly
                                    maxLength={50}
                                    className="bg-muted cursor-not-allowed"
                                    placeholder="Ex: Jean"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Nom <span className="text-red-500">*</span></Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    defaultValue={user?.lastName || ""}
                                    required
                                    readOnly
                                    maxLength={50}
                                    className="bg-muted cursor-not-allowed"
                                    placeholder="Ex: Dupont"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone (Français)</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={user?.phone || ""}
                                    placeholder="06 12 34 56 78"
                                    maxLength={12}
                                    pattern="^[0-9\s]+$"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Date de naissance</Label>
                                <Input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    readOnly
                                    className="bg-muted cursor-not-allowed"
                                    defaultValue={birthDateValue}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" disabled={profileLoading} variant="secondary">
                                {profileLoading && <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />}
                                Mettre à jour le profil
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Password Card */}
            <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary">
                <CardHeader className="pb-3 border-b border-border mb-5">
                    <CardTitle className="text-lg text-secondary">Changer mon mot de passe</CardTitle>
                    <CardDescription>
                        Assurez-vous d'utiliser un mot de passe robuste pour protéger votre compte.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="profile-form" action={handleUpdatePassword} className="space-y-4">
                        {message && (
                            <div className={`p-4 text-sm rounded-lg flex items-center gap-2 ${message.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                {message.type === "success" ? (
                                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                                ) : (
                                    <AlertCircleIcon className="h-4 w-4 shrink-0" />
                                )}
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" disabled={loading} variant="secondary">
                                {loading && <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />}
                                Mettre à jour le mot de passe
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
