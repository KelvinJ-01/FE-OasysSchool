import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search, Upload, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useStudentsQuery, useClassesQuery, useStudentMutations } from '../../hooks/useStudents';
import { env } from '../../config/env';
import { getApiErrorMessage } from '../../lib/apiClient';
import { toTitleCase, toSentenceCase } from '../../lib/format';
import { studentSchema } from '../../lib/schemas';
import { parseFormData, firstError } from '../../lib/validateForm';
import { PhotoUpload } from '../../components/common/PhotoUpload';
import { Spinner } from '../../components/common/Spinner';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ActionIcons } from '../../components/common/ActionIcons';
import { ImportModal } from '../../components/common/ImportModal';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import type { Student, ClassEntity, StudentStatus, Gender, Religion, StudentGuardian } from '../../types/entities';
import type { CreateStudentRequest } from '../../types/dataMaster';

const STATUS_LABEL: Record<StudentStatus, string> = {
  aktif: 'Aktif',
  pindah_sekolah: 'Pindah Sekolah',
  keluar: 'Keluar',
};

const GENDER_LABEL: Record<Gender, string> = { laki_laki: 'Laki-laki', perempuan: 'Perempuan' };
const RELIGION_LABEL: Record<Religion, string> = {
  islam: 'Islam', kristen: 'Kristen', katolik: 'Katolik', hindu: 'Hindu', buddha: 'Buddha', konghucu: 'Konghucu',
};

const inputCls = 'h-11 w-full rounded-md border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';
const labelCls = 'mb-1.5 block text-[13.5px] font-medium text-gray-900 dark:text-white/90';

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'administrator';

  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, classFilter]);

  const classesQuery = useClassesQuery();
  const classes: ClassEntity[] = classesQuery.data ?? [];

  const studentsQuery = useStudentsQuery({
    page: pageNumber,
    pageSize: env.defaultPageSize,
    search: debouncedSearch,
    classId: classFilter,
  });

  const items = studentsQuery.data?.items ?? [];
  const totalPages = studentsQuery.data?.totalPages ?? 1;
  const listError = studentsQuery.isError ? getApiErrorMessage(studentsQuery.error, 'Gagal memuat data siswa.') : null;

  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: isDetailOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  const columns: Column<Student>[] = [
    {
      key: 'fullName',
      header: 'Siswa',
      render: (s) => (
        <span className="flex items-center gap-3">
          {s.photoUrl ? (
            <img src={s.photoUrl} alt="" className="size-9 rounded-full object-cover" />

          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-600 dark:bg-brand-500/10">
              {initials(s.fullName)}
            </span>

          )}
          <span>
            <span className="block font-medium text-gray-800 dark:text-white/90">{s.fullName}</span>

            <span className="block text-theme-xs text-gray-400">{s.gender ? GENDER_LABEL[s.gender] : '—'}</span>

          </span>

        </span>

      ),
    },
    { key: 'nisn', header: 'NISN', render: (s) => s.nisn },
    { key: 'classId', header: 'Kelas', render: (s) => classes.find((c) => c.id === s.classId)?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span className={`rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${s.status === 'aktif' ? 'bg-secondary-50 text-secondary-700' : 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[s.status]}
        </span>

      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s: Student) => (
        <ActionIcons
          label={s.fullName}
          onDetail={() => { setActiveStudent(s); openDetailModal(); }}
          onEdit={isAdmin ? () => { setActiveStudent(s); openFormModal(); } : undefined}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={16} aria-hidden="true" />

            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NISN..."
              aria-label="Cari siswa"
              className="h-10 w-56 rounded-md border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />

          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Filter kelas"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-theme-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Semua Kelas</option>

            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>

            ))}
          </select>

        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openImportModal}
              className="flex h-10 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <Upload size={16} aria-hidden="true" />

              Impor
            </button>

            <button
              type="button"
              onClick={() => { setActiveStudent(null); openFormModal(); }}
              className="flex h-10 items-center gap-1.5 rounded-md bg-brand-500 px-4 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Plus size={16} aria-hidden="true" />

              Tambah Siswa
            </button>

          </div>

        )}
      </div>

      {listError && (
        <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">
          {listError}
        </div>

      )}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(s) => s.id}
        isLoading={studentsQuery.isPending}
        emptyMessage="Belum ada data siswa."
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
      />

      {isAdmin && (
        <StudentFormModal
          isOpen={isFormOpen}
          onClose={closeFormModal}
          student={activeStudent}
          classes={classes}
          onSaved={() => {
            closeFormModal();
            toast.success(activeStudent ? 'Data siswa berhasil diubah.' : 'Siswa baru berhasil ditambahkan.');
          }}
        />
      )}

      {activeStudent && (
        <StudentDetailModal isOpen={isDetailOpen} onClose={closeDetailModal} student={activeStudent} classes={classes} canPrint={isAdmin} />
      )}

      <ImportModal
        isOpen={isImportOpen}
        onClose={closeImportModal}
        resource="students"
        resourceLabel="Siswa"
        onImported={(result) => {
          closeImportModal();
          toast.success(result.message);
        }}
      />
    </div>

  );
}

function StudentDetailModal({ isOpen, onClose, student, classes, canPrint }: { isOpen: boolean; onClose: () => void; student: Student; classes: ClassEntity[]; canPrint: boolean }) {
  const rows: Array<[string, string]> = [
    ['NISN', student.nisn],
    ['Kelas', classes.find((c) => c.id === student.classId)?.name ?? 'Belum ditentukan'],
    ['Jenis Kelamin', student.gender ? GENDER_LABEL[student.gender] : 'Belum diisi'],
    ['Agama', student.religion ? RELIGION_LABEL[student.religion] : 'Belum diisi'],
    ['Email', student.email ?? 'Belum diisi'],
    ['Nomor Telepon', student.phone ?? 'Belum diisi'],
    ['Alamat', student.address ?? 'Belum diisi'],
    ['Nama Ayah', student.fatherName ?? 'Belum diisi'],
    ['Nama Ibu', student.motherName ?? 'Belum diisi'],
    ['Wali Siswa 1', student.guardian1 ? `${student.guardian1.name}${student.guardian1.phone ? ` (${student.guardian1.phone})` : ''}` : 'Tidak ada'],
    ['Wali Siswa 2', student.guardian2 ? `${student.guardian2.name}${student.guardian2.phone ? ` (${student.guardian2.phone})` : ''}` : 'Tidak ada'],
  ];

  function handlePrintQr() {
    const qrSvg = document.getElementById(`qr-${student.id}`)?.outerHTML ?? '';
    const photo = student.photoUrl
      ? `<img src="${student.photoUrl}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb"/>`
      : `<div style="width:64px;height:64px;border-radius:50%;background:#eef4ff;color:#1b3a6b;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px">${student.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</div>`;
    const win = window.open('', '_blank', 'width=460,height=680');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Kartu QR ${student.fullName}</title>
      <style>
        @page { size: 54mm 86mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; display: flex; justify-content: center; padding: 12px; background: #f3f4f6; }
        .card { width: 54mm; height: 86mm; background: #fff; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
        .head { background: #1b3a6b; color: #fff; padding: 10px 12px; display: flex; align-items: center; gap: 8px; }
        .head img.logo { width: 22px; height: 22px; }
        .head .brand { font-size: 11px; font-weight: 700; letter-spacing: .3px; }
        .head .school { font-size: 8.5px; opacity: .85; }
        .body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12px 10px 8px; text-align: center; }
        .name { margin-top: 8px; font-size: 12.5px; font-weight: 700; color: #111827; line-height: 1.25; }
        .nisn { margin-top: 2px; font-size: 10px; color: #6b7280; letter-spacing: .5px; }
        .qr { margin-top: 10px; padding: 6px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
        .qr svg { width: 88px !important; height: 88px !important; display: block; }
        .foot { padding: 6px 10px 9px; text-align: center; font-size: 7.5px; color: #9ca3af; border-top: 1px dashed #e5e7eb; }
        @media print { body { background: #fff; padding: 0; } .card { box-shadow: none; border-radius: 0; } }
      </style>
      </head><body>
      <div class="card">
        <div class="head">
          <img class="logo" src="${window.location.origin}/images/logo/Oasys_School_Logo_3.webp" alt=""/>
          <div><div class="brand">OASYS SCHOOL</div><div class="school">SD Oasys School</div></div>
        </div>
        <div class="body">
          ${photo}
          <div class="name">${student.fullName}</div>
          <div class="nisn">NISN ${student.nisn}</div>
          <div class="qr">${qrSvg}</div>
        </div>
        <div class="foot">Pindai kartu ini saat presensi masuk & pulang</div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},250)}</` + `script></body></html>`);
    win.document.close();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-2xl">
      <div className="p-6">
        <div className="flex items-center gap-4">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="size-14 rounded-full object-cover" />

          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-[18px] font-semibold text-brand-600 dark:bg-brand-500/10">
              {initials(student.fullName)}
            </span>

          )}
          <div>
            <h3 className="text-[16px] font-semibold text-gray-800 dark:text-white/90">{student.fullName}</h3>

            <p className="text-theme-xs text-gray-400">Status: {STATUS_LABEL[student.status]}</p>

          </div>

        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
          <dl className="space-y-2.5">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[130px_1fr] gap-2 text-[13.5px]">
                <dt className="text-gray-400">{label}</dt>

                <dd className="text-gray-700 dark:text-gray-300">{value}</dd>

              </div>

            ))}
          </dl>

          {student.qrCode && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="rounded-lg bg-white p-2">
                <QRCode id={`qr-${student.id}`} value={student.qrCode} size={128} />
              </div>

              <p className="max-w-[150px] text-center text-theme-xs leading-snug text-gray-400">
                QR statis untuk dicetak dan dibagikan ke siswa
              </p>

              {canPrint && (
              <button
                type="button"
                onClick={handlePrintQr}
                className="flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <Printer size={14} aria-hidden="true" />

                Cetak Kartu QR
              </button>

              )}
            </div>

          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">
            Tutup
          </button>

        </div>

      </div>

    </Modal>

  );
}

function StudentFormModal({ isOpen, onClose, student, classes, onSaved }: { isOpen: boolean; onClose: () => void; student: Student | null; classes: ClassEntity[]; onSaved: () => void }) {
  const isEdit = !!student;
  const { create, update } = useStudentMutations();
  const [form, setForm] = useState({
    fullName: '', nisn: '', classId: '', gender: '' as '' | Gender, religion: '' as '' | Religion,
    email: '', phone: '', address: '', fatherName: '', motherName: '',
    guardian1Name: '', guardian1Phone: '', guardian2Name: '', guardian2Phone: '',
    status: 'aktif' as StudentStatus,
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = create.isPending || update.isPending;

  useEffect(() => {
    setForm({
      fullName: student?.fullName ?? '',
      nisn: student?.nisn ?? '',
      classId: student?.classId ?? '',
      gender: student?.gender ?? '',
      religion: student?.religion ?? '',
      email: student?.email ?? '',
      phone: student?.phone ?? '',
      address: student?.address ?? '',
      fatherName: student?.fatherName ?? '',
      motherName: student?.motherName ?? '',
      guardian1Name: student?.guardian1?.name ?? '',
      guardian1Phone: student?.guardian1?.phone ?? '',
      guardian2Name: student?.guardian2?.name ?? '',
      guardian2Phone: student?.guardian2?.phone ?? '',
      status: student?.status ?? 'aktif',
    });
    setPhoto(student?.photoUrl ?? null);
    setError(null);
  }, [student, isOpen]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseFormData(studentSchema, {
      fullName: form.fullName,
      nisn: form.nisn,
      classId: form.classId || undefined,
      gender: form.gender || undefined,
      religion: form.religion || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      fatherName: form.fatherName || undefined,
      motherName: form.motherName || undefined,
      guardian1Name: form.guardian1Name || undefined,
      guardian2Name: form.guardian2Name || undefined,
    });
    if (!parsed.success) { setError(firstError(parsed.errors)); return; }

    const guardian1: StudentGuardian | undefined = form.guardian1Name ? { name: toTitleCase(form.guardian1Name), relation: 'wali', phone: form.guardian1Phone || null } : undefined;
    const guardian2: StudentGuardian | undefined = form.guardian2Name ? { name: toTitleCase(form.guardian2Name), relation: 'wali', phone: form.guardian2Phone || null } : undefined;
    const payload: CreateStudentRequest & { status?: StudentStatus } = {
      fullName: toTitleCase(form.fullName), nisn: form.nisn,
      classId: form.classId || undefined,
      gender: form.gender || undefined,
      religion: form.religion || undefined,
      email: form.email.toLowerCase() || undefined,
      phone: form.phone || undefined,
      address: form.address ? toSentenceCase(form.address) : undefined,
      fatherName: form.fatherName ? toTitleCase(form.fatherName) : undefined,
      motherName: form.motherName ? toTitleCase(form.motherName) : undefined,
      guardian1, guardian2,
      photoDataUrl: photo ?? '',
      ...(isEdit ? { status: form.status } : {}),
    };
    try {
      if (isEdit && student) {
        await update.mutateAsync({ id: student.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gagal menyimpan data siswa.'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-2xl">
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <h3 className="mb-5 pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{isEdit ? 'Ubah Siswa' : 'Tambah Siswa'}</h3>

        {error && <div role="alert" className="mb-4 rounded-md border border-error-200 bg-error-50 px-3.5 py-3 text-[13.5px] text-error-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PhotoUpload value={photo} onChange={setPhoto} name={form.fullName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="st-fullName" className={labelCls}>Nama Lengkap<span aria-hidden="true" className="text-error-500"> *</span></label>
              <input id="st-fullName" type="text" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} onBlur={(e) => set('fullName', toTitleCase(e.target.value))} className={inputCls} />
            </div>

            {!isEdit && (
              <div>
                <label htmlFor="st-nisn" className={labelCls}>NISN<span aria-hidden="true" className="text-error-500"> *</span></label>
                <input id="st-nisn" type="text" required inputMode="numeric" maxLength={10} value={form.nisn} onChange={(e) => set('nisn', e.target.value.replace(/\D/g, ''))} className={inputCls} />
              </div>

            )}
            <div>
              <label htmlFor="st-class" className={labelCls}>Kelas</label>

              <select id="st-class" value={form.classId} onChange={(e) => set('classId', e.target.value)} className={inputCls}>
                <option value="">Belum ditentukan</option>

                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}

              </select>

            </div>

            <div>
              <label htmlFor="st-gender" className={labelCls}>Jenis Kelamin</label>

              <select id="st-gender" value={form.gender} onChange={(e) => set('gender', e.target.value as Gender | '')} className={inputCls}>
                <option value="">Pilih</option>

                {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}

              </select>

            </div>

            <div>
              <label htmlFor="st-religion" className={labelCls}>Agama</label>

              <select id="st-religion" value={form.religion} onChange={(e) => set('religion', e.target.value as Religion | '')} className={inputCls}>
                <option value="">Pilih</option>

                {(Object.keys(RELIGION_LABEL) as Religion[]).map((r) => <option key={r} value={r}>{RELIGION_LABEL[r]}</option>)}

              </select>

            </div>

            <div>
              <label htmlFor="st-email" className={labelCls}>Email</label>

              <input id="st-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label htmlFor="st-phone" className={labelCls}>Nomor Telepon</label>

              <input id="st-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="st-address" className={labelCls}>Alamat</label>

              <input id="st-address" type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
            </div>

          </div>

          <p className="pt-1 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Keluarga</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="st-father" className={labelCls}>Nama Ayah</label>

              <input id="st-father" type="text" value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} onBlur={(e) => set('fatherName', toTitleCase(e.target.value))} className={inputCls} />
            </div>

            <div>
              <label htmlFor="st-mother" className={labelCls}>Nama Ibu</label>

              <input id="st-mother" type="text" value={form.motherName} onChange={(e) => set('motherName', e.target.value)} onBlur={(e) => set('motherName', toTitleCase(e.target.value))} className={inputCls} />
            </div>

            <div>
              <label htmlFor="st-g1" className={labelCls}>Nama Wali Siswa 1 (opsional)</label>

              <input id="st-g1" type="text" value={form.guardian1Name} onChange={(e) => set('guardian1Name', e.target.value)} onBlur={(e) => set('guardian1Name', toTitleCase(e.target.value))} className={inputCls} />
            </div>

            <div>
              <label htmlFor="st-g1p" className={labelCls}>Telepon Wali Siswa 1</label>

              <input id="st-g1p" type="tel" value={form.guardian1Phone} onChange={(e) => set('guardian1Phone', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label htmlFor="st-g2" className={labelCls}>Nama Wali Siswa 2 (opsional)</label>

              <input id="st-g2" type="text" value={form.guardian2Name} onChange={(e) => set('guardian2Name', e.target.value)} onBlur={(e) => set('guardian2Name', toTitleCase(e.target.value))} className={inputCls} />
            </div>

            <div>
              <label htmlFor="st-g2p" className={labelCls}>Telepon Wali Siswa 2</label>

              <input id="st-g2p" type="tel" value={form.guardian2Phone} onChange={(e) => set('guardian2Phone', e.target.value)} className={inputCls} />
            </div>

          </div>

          {isEdit && (
            <div>
              <label htmlFor="st-status" className={labelCls}>Status Siswa</label>

              <select id="st-status" value={form.status} onChange={(e) => set('status', e.target.value as StudentStatus)} className={inputCls}>
                <option value="aktif">Aktif</option>

                <option value="pindah_sekolah">Pindah Sekolah</option>

                <option value="keluar">Keluar</option>

              </select>

            </div>

          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-md px-4 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5">Batal</button>

            <button type="submit" disabled={isSubmitting} className="flex h-10 items-center rounded-md bg-brand-500 px-5 text-theme-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
              {isSubmitting ? (<><Spinner size="sm" className="mr-2" />Menyimpan...</>) : 'Simpan'}
            </button>

          </div>

        </form>

      </div>

    </Modal>

  );
}
