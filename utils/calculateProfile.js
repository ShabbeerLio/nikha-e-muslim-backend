export const calculateProfileCompletion = (user) => {
  const fields = [
    user.name,
    user.gender,
    user.dob?.day,
    user.dob?.month,
    user.dob?.year,
    user.height?.ft,
    user.height?.inch,
    user.maritalStatus,
    user.city,
    user.state,
    user.religion,
    user.sect,
    user.caste,
    user.maslak,
    user.dowry,
    user.nikahAsSunnat,
    user.qualification,
    user.institute,
    user.profession,
    user.workSector,
    user.income,
    user.mobile,
    user.whatsapp,
    user.profilePic?.url,
    user.images?.length > 0,
    user.family?.location,
    user.family?.status,
    user.family?.type,
    user.family?.fatherName,
    user.family?.fatherOccupation,
    user.family?.motherOccupation,
    user.religiousDetail?.length > 0,
    user.interest?.length > 0,
    user.about,
  ];

  const filled = fields.filter(f => f && f !== "").length;
  const total = fields.length;

  return Math.round((filled / total) * 100);
};