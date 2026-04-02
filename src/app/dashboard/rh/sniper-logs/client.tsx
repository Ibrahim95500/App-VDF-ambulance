"use client"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye } from "lucide-react"

export function SniperLogClient({ data }: { data: any[] }) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS": return <Badge className="bg-green-500">Succès Auto</Badge>;
            case "MANUAL_SUCCESS": return <Badge className="bg-blue-500">Succès Manuel</Badge>;
            case "FAILED_ALREADY_TAKEN": return <Badge variant="destructive">Échec (Déjà pris)</Badge>;
            case "MANUAL_PENDING": return <Badge variant="secondary">Attente Décision</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Date RDV</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Départ</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Arrivée</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8">L'historique est vide. Le bot n'a encore rien attrapé ou évalué.</TableCell></TableRow>
                    ) : data.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-bold">{log.num || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.datePec || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.heurePec || "-"}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={log.demandeur}>{log.demandeur || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={log.depart}>{log.depart}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={log.patient}>{log.patient || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={log.arrivee}>{log.arrivee}</TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
                                    {log.num && (
                                        <a href={`https://transportpatient.fr/Transport/ImpDemande.aspx?IDDemande=${log.num}`} target="_blank" rel="noreferrer" title="Voir sur AMC" className="p-2 hover:bg-muted rounded-full transition-colors inline-flex justify-center items-center">
                                            <Eye className="w-5 h-5 text-blue-400" />
                                        </a>
                                    )}
                                    {log.imageUrl && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button title="Preuve (Capture)" className="p-2 hover:bg-muted rounded-full transition-colors inline-flex justify-center items-center">
                                                    <span className="text-lg">📸</span>
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl p-2 bg-black border-none">
                                                <DialogHeader className="sr-only">
                                                    <DialogTitle>Capture de la course AMC</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex justify-center bg-black">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={log.imageUrl} alt="Preuve" className="max-h-[85vh] object-contain rounded-md" />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {!log.num && !log.imageUrl && (
                                        <span className="text-muted-foreground text-xs italic">-</span>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
